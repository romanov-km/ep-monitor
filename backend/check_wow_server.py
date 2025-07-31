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
BOT_TOKEN = os.getenv("BOT_TOKEN")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
HOST = "game.project-epoch.net"
PORT = 3724
CHECK_INTERVAL = 60
LAST_UPDATE_ID = 0

REALMS = [
    {"name": "Kezan PVE", "host": "game.project-epoch.net", "port": 8085},
    {"name": "Gurubashi PVP", "host": "game.project-epoch.net", "port": 8086},
]

# Telegram
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

def send_telegram_message(chat_id, message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "reply_markup": {
            "inline_keyboard": [
                [{"text": "🔁 Проверить", "callback_data": "check"}],
                [{"text": "📊 Состояние", "callback_data": "status"}],
                [{"text": "ℹ️ О проекте", "url": "https://project-epoch.net"}]
            ]
        }
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
                    save_user(chat_id)

                    if msg.get("text") == "/start":
                        send_telegram_message(chat_id, "👋 Привет! Я слежу за WoW-сервером.")
                    elif msg.get("text") == "/status":
                        send_telegram_message(chat_id, check_server_status_text())

                if "callback_query" in result:
                    q = result["callback_query"]
                    chat_id = q["from"]["id"]
                    data = q["data"]
                    if data == "check":
                        send_telegram_message(chat_id, check_server_status_text())
                    elif data == "status":
                        send_telegram_message(chat_id, f"📊 Сервер проверяется каждые {CHECK_INTERVAL} сек.")
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

# 🌐 Проверка реалмов

def monitor_realms():
    last_realm_statuses = {}

    while True:
        for realm in REALMS:
            is_up = check_tcp_port(realm["host"], realm["port"])
            status = "UP" if is_up else "DOWN"
            name = realm["name"]
            timestamp = datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
            icon = "🟢" if status == "UP" else "🔴"
            msg = f"{timestamp} Realm {name} status: {icon} {status}"
            print(msg)

            redis_key = f"logs:{name.replace(' ', '_')}"
            try:
                r.lpush(redis_key, msg)
                r.ltrim(redis_key, 0, 499)
            except Exception as e:
                print(f"⚠️ Redis error for realm {name}: {e}")

            last = last_realm_statuses.get(name)
            if last is not None and last != status:
                send_telegram_message_to_all(msg)
                send_discord_message(f"Realm {name} status changed: {icon} {status}")
            last_realm_statuses[name] = status

        time.sleep(CHECK_INTERVAL)


def telegram_listener_loop():
    while True:
        update_new_users()
        time.sleep(3)

# Запуск
if __name__ == "__main__":
    print("🚀 Запуск мониторинга...")

    threading.Thread(target=monitor_auth, daemon=True).start()
    threading.Thread(target=monitor_realms, daemon=True).start()
    threading.Thread(target=telegram_listener_loop, daemon=True).start()

    # Блокируем основной поток, чтобы скрипт не завершился
    while True:
        time.sleep(3600)
