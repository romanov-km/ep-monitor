import socket
import time
import requests
from datetime import datetime
import redis
from dotenv import load_dotenv
load_dotenv()
import os
import threading

# Redis клиент
r = redis.Redis.from_url(os.getenv("REDIS_URL"))

# Проверка соединения
try:
    r.ping()
except redis.exceptions.ConnectionError as e:
    print(f"❌ Redis недоступен: {e}")
    exit(1)

# Константы
API_URL= os.getenv("API_URL")
BOT_TOKEN = os.getenv("BOT_TOKEN")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
HOST = "57.128.162.57"
PORT = 3724
CHECK_INTERVAL = 60
LAST_UPDATE_ID = 0
REALMS = ["Kezan", "Gurubashi"]
PATCH_MANIFEST_URL = os.getenv("PATCH_MANIFEST_URL")
PATCH_CHECK_INTERVAL = 60
REDIS_PATCH_KEY = "latest_patch_version"

# Telegram

from locales import translations

def get_patch_version():
    try:
        resp = requests.get(PATCH_MANIFEST_URL, timeout=10)
        data = resp.json()
        version = data.get("Version")
        checked_at = data.get("checked_at")
        return version, checked_at
    except Exception as e:
        print(f"⚠️ Ошибка при запросе манифеста патча: {e}")
        return None, None
    
def monitor_patch_version():
    while True:
        version, checked_at = get_patch_version()
        if version and checked_at:
            prev_version = r.get("latest_patch_version")
            if prev_version is None or prev_version.decode() != version:
                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                r.set("latest_patch_version", version)
                r.set("latest_patch_checked_at", checked_at)
                r.set("latest_patch_changed_at", now_str)
                msg = f"🆕 Патч обновлён!\nВерсия: {version}\nВыложен: {checked_at}\nОбнаружен монитором: {now_str}"
                print(msg)
                send_telegram_message_to_all(msg)
                send_discord_message(msg)
            else:
                # Просто обновляем дату последнего запроса к манифесту (на всякий)
                r.set("latest_patch_checked_at", checked_at)
        time.sleep(PATCH_CHECK_INTERVAL)

def delete_telegram_message(chat_id, message_id):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/deleteMessage"
    payload = {
        "chat_id": chat_id,
        "message_id": message_id
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"‼️ Telegram delete error: {e}")        

def t(key, lang="ru", **kwargs):
    value = translations.get(lang, {}).get(key, key)
    if isinstance(value, str):
        return value.format(**kwargs)
    return value
#new
def get_realm_status(realm_name):
    try:
        resp = requests.get(API_URL, timeout=5)
        data = resp.json()
        for realm in data.get("realms", []):
            if realm["name"] == realm_name:
                return realm["worldServerOnline"], realm["lastOnline"]
    except Exception as e:
        print(f"⚠️ Ошибка при запросе API: {e}")
    return None, None

# Запись логов в Redis
def log_realm_status(realm_name, msg):
    redis_key = f"logs:{realm_name.replace(' ', '_')}"
    try:
        r.lpush(redis_key, msg)
        r.ltrim(redis_key, 0, 499)
    except Exception as e:
        print(f"⚠️ Redis ошибка при записи логов: {e}")

# Мониторинг статуса реалма через API
def monitor_realm(realm_name):
    last_status = None

    while True:
        is_online, last_online = get_realm_status(realm_name)
        status = "UP" if is_online else "DOWN"
        icon = "🟢" if is_online else "🔴"
        timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
        msg = f"{timestamp} Realm {realm_name} status: {icon} {status}"
        print(msg)

        log_realm_status(realm_name, msg)

        if last_status is not None and last_status != status:
            send_telegram_message_to_all(msg)
            send_discord_message(f"Realm {realm_name} status changed: {icon} {status}")

        last_status = status
        time.sleep(CHECK_INTERVAL)

def get_user_lang(chat_id):
    return r.get(f"lang:{chat_id}").decode("utf-8") if r.exists(f"lang:{chat_id}") else "ru"

def set_user_lang(chat_id, lang):
    r.set(f"lang:{chat_id}", lang)

def load_users():
    try:
        return set(map(int, r.smembers("users")))
    except Exception as e:
        print(f"‼️ Redis read users error: {e}")
        return set()

def save_user(chat_id):
    try:
        r.sadd("users", chat_id)
    except Exception as e:
        print(f"⚠️ Redis error while saving user: {e}")

def remove_user(chat_id):
    try:
        r.srem("users", chat_id)
    except Exception as e:
        print(f"⚠️ Redis error while removing user: {e}")

def send_telegram_message(chat_id, message):
    lang = get_user_lang(chat_id)  # Получаем язык пользователя
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    keyboard = {
        "inline_keyboard": [
            [{"text": t("check_btn", lang), "callback_data": "check"}],
            [{"text": t("status_btn", lang), "callback_data": "status"}],
            [{"text": t("project_btn", lang), "url": "https://project-epoch.net"}],
            [{"text": t("unsubscribe_btn", lang), "callback_data": "unsubscribe"}],
            [{"text": t("realms_btn", lang), "callback_data": "realms"}],
            [
                {"text": "🇷🇺 Русский", "callback_data": "lang_ru"},
                {"text": "🇺🇸 English", "callback_data": "lang_en"}
            ]
        ]
    }

    payload = {
        "chat_id": chat_id,
        "text": message,
        "reply_markup": keyboard
    }

    try:
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code != 200:
            print(f"⚠️ Telegram error {chat_id}: {resp.status_code} — {resp.text}")
    except Exception as e:
        print(f"‼️ Telegram send error: {e}")

def send_telegram_message_to_all(message):
    for uid in load_users():
        send_telegram_message(uid, message)

def update_new_users():
    global LAST_UPDATE_ID
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={LAST_UPDATE_ID + 1}"
    try:
        resp = requests.get(url, timeout=5)
        data = resp.json()
        
        if data.get("ok"):
            for result in data["result"]:
                LAST_UPDATE_ID = result["update_id"]
                if "message" in result:
                    msg = result["message"]
                    chat_id = msg["chat"]["id"]
                    text = msg.get("text", "")
                    lang = get_user_lang(chat_id)
                    if text == "/start":
                        save_user(chat_id)
                        lang = get_user_lang(chat_id)
                        send_telegram_message(chat_id, t("start", lang))
                    elif text == "/stop":
                        remove_user(chat_id)
                        send_telegram_message(chat_id, t("unsubscribed", lang))
                    elif text == "/status":
                        lang = get_user_lang(chat_id)
                        send_telegram_message(chat_id, t("status_info", lang, interval=CHECK_INTERVAL))
                    elif text == "/realms":
                        send_telegram_message(chat_id, get_realms_status_text())
                    elif text == "/patch":
                        version = r.get("latest_patch_version")
                        checked_at = r.get("latest_patch_checked_at")
                        changed_at = r.get("latest_patch_changed_at")
                        if version:
                            msg = (
                                f"🆕 Current patch version: {version.decode()}\n"
                                f"📅 Uploaded: {checked_at.decode() if checked_at else '-'}\n"
                                f"🔄 Detected: {changed_at.decode() if changed_at else '-'}"
                            )
                            send_telegram_message(chat_id, msg)
                        else:
                            send_telegram_message(chat_id, "The patch version has not yet been determined.")


                if "callback_query" in result:
                    q = result["callback_query"]
                    chat_id = q["from"]["id"]
                    data = q["data"]
                    lang = get_user_lang(chat_id)
                    message_id = q["message"]["message_id"]
                    if data == "check":
                        send_telegram_message(chat_id, check_server_status_text())
                        delete_telegram_message(chat_id, message_id)
                    elif data == "status":
                        send_telegram_message(chat_id, t("status_info", lang, interval=CHECK_INTERVAL))
                        delete_telegram_message(chat_id, message_id)
                    elif data == "unsubscribe":
                        remove_user(chat_id)
                        send_telegram_message(chat_id, t("unsubscribed", lang))
                        delete_telegram_message(chat_id, message_id)
                    elif data.startswith("lang_"):
                        set_user_lang(chat_id, data.split("_")[1])
                        send_telegram_message(chat_id, t("language_set", get_user_lang(chat_id)))
                    elif data == "realms":
                        send_telegram_message(chat_id, get_realms_status_text())
                        delete_telegram_message(chat_id, message_id)
                    elif data == "patch":
                        version = r.get("latest_patch_version")
                        checked_at = r.get("latest_patch_checked_at")
                        changed_at = r.get("latest_patch_changed_at")
                        if version:
                            msg = (
                                f"🆕 Current patch version: {version.decode()}\n"
                                f"📅 Uploaded: {checked_at.decode() if checked_at else '-'}\n"
                                f"🔄 Detected: {changed_at.decode() if changed_at else '-'}"
                            )
                            send_telegram_message(chat_id, msg)
                            delete_telegram_message(chat_id, message_id)
                        else:
                            send_telegram_message(chat_id, "The patch version has not yet been determined.")
                            delete_telegram_message(chat_id, message_id)

                    requests.post(f"https://api.telegram.org/bot{BOT_TOKEN}/answerCallbackQuery",
                                  json={"callback_query_id": q["id"]})
    except Exception as e:
        print(f"⚠️ Failed to get updates: {e}")


# Discord
def send_discord_message(message):
    payload = {"content": message}
    try:
        resp = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=5)
        if resp.status_code != 204:
            print(f"⚠️ Discord error: {resp.status_code}")
    except Exception as e:
        print(f"‼️ Discord send error: {e}")

# Статус
def check_tcp_port(ip, port, timeout=3):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except Exception:
        return False

def check_server_status_text():
    is_up = check_tcp_port(HOST, PORT)
    icon = "🟢" if is_up else "🔴"
    return f"{datetime.now().strftime('%H:%M:%S')} Сервер: {HOST}:{PORT} {icon} {'UP' if is_up else 'DOWN'}"

def get_realms_status_text():
    lines = []
    for realm_name in REALMS:
        is_online, _ = get_realm_status(realm_name)
        icon = "🟢" if is_online else "🔴"
        status = "UP" if is_online else "DOWN"
        lines.append(f"{realm_name}: {icon} {status}")
    return "\n".join(lines)

def log_status(status):
    timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
    icon = "🟢" if status == "UP" else "🔴"
    msg = f"{timestamp} Authserver status: {icon} {status}"
    print(msg)
    r.lpush("logs", msg)
    r.ltrim("logs", 0, 999)

# 🔐 Проверка Auth-сервера

def monitor_auth():
    global last_auth_status
    last_auth_status = None

    while True:
        auth_is_up = check_tcp_port(HOST, PORT)
        auth_status = "UP" if auth_is_up else "DOWN"
        log_status(auth_status)

        if last_auth_status is not None and auth_status != last_auth_status:
            send_telegram_message_to_all(check_server_status_text())
            send_discord_message(auth_status)

        last_auth_status = auth_status
        time.sleep(CHECK_INTERVAL)

def telegram_listener_loop():
    while True:
        update_new_users()
        time.sleep(3)

# Запуск
if __name__ == "__main__":
    print("🚀 Запуск мониторинга...")
    
    threading.Thread(target=monitor_auth, daemon=True).start()

    for realm in REALMS:
        threading.Thread(target=monitor_realm, args=(realm,), daemon=True).start()
    
    threading.Thread(target=monitor_patch_version, daemon=True).start()

    #threading.Thread(target=monitor_realms, daemon=True).start()
    threading.Thread(target=telegram_listener_loop, daemon=True).start()

    # Блокируем основной поток, чтобы скрипт не завершился
    while True:
        time.sleep(3600)
