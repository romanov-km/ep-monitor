import socket
import time
import requests
from datetime import datetime
import json
from dotenv import load_dotenv
import os

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
CHAT_ID = os.getenv("CHAT_ID")

HOST = "game.project-epoch.net"  # IP или домен # или домен, например game.project-epoch.net 198.18.0.18 198.246.145.233  198.244.165.233:3724
PORT = 3724
CHECK_INTERVAL = 5  # секунд
USERS_FILE = "users.txt"
LAST_UPDATE_ID = 0

def load_users():
    try:
        with open(USERS_FILE, "r") as f:
            return set(line.strip() for line in f if line.strip().isdigit())
    except FileNotFoundError:
        return set()

def save_user(chat_id):
    users = load_users()
    if str(chat_id) not in users:
        with open(USERS_FILE, "a") as f:
            f.write(str(chat_id) + "\n")

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
    message = f"{timestamp} Authserver status: {icon} {status}"
    print(message)
    with open("server_log.txt", "a") as f:
        f.write(message + "\n")

def send_telegram_message_to_all(text):
    users = load_users()
    for chat_id in users:
        send_telegram_message(chat_id, text)

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
        r = requests.post(url, json=payload, timeout=5)
        if r.status_code != 200:
            print(f"⚠️ Telegram error for {chat_id}: {r.status_code} — {r.text}")
    except Exception as e:
        print(f"‼️ Telegram send error: {e}")

def update_new_users():
    global LAST_UPDATE_ID
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={LAST_UPDATE_ID + 1}"
    try:
        r = requests.get(url, timeout=5)
        data = r.json()
        if data.get("ok"):
            for result in data["result"]:
                LAST_UPDATE_ID = result["update_id"]

                # Обработка текстовых сообщений
                if "message" in result:
                    msg = result["message"]
                    chat_id = msg["chat"]["id"]
                    save_user(chat_id)

                    if msg.get("text") == "/start":
                        send_telegram_message(chat_id, "👋 Привет! Я буду уведомлять о статусе WoW-сервера.")
                    elif msg.get("text") == "/status":
                        send_telegram_message(chat_id, "📊 " + check_server_status_text())

                # Обработка кнопок
                if "callback_query" in result:
                    query = result["callback_query"]
                    chat_id = query["from"]["id"]
                    data = query["data"]

                    if data == "check":
                        send_telegram_message(chat_id, check_server_status_text())
                    elif data == "status":
                        send_telegram_message(chat_id, f"📊 Сервер проверяется каждые {CHECK_INTERVAL} сек.")

                    # Ответ на callback
                    callback_id = query["id"]
                    requests.post(
                        f"https://api.telegram.org/bot{BOT_TOKEN}/answerCallbackQuery",
                        json={"callback_query_id": callback_id}
                    )
    except Exception as e:
        print(f"⚠️ Failed to get updates: {e}")

def send_discord_message(status):
    icon = "🟢" if status == "UP" else "🔴"
    message = f"Authserver status changed: {icon} {status}"
    data = {"content": message}
    try:
        r = requests.post(DISCORD_WEBHOOK_URL, json=data, timeout=5)
        if r.status_code != 204:
            print(f"⚠️ Webhook failed: {r.status_code}")
    except requests.exceptions.Timeout:
        print("⏱️ Discord webhook timeout")
    except Exception as e:
        print(f"‼️ Error sending Discord message: {e}")

def main():
    last_status = None
    print("🚀 Скрипт запущен. Мониторим сервер WoW...")

    while True:
        update_new_users()

        is_up = check_tcp_port(HOST, PORT)
        current_status = "UP" if is_up else "DOWN"
        log_status(current_status)

        if last_status is not None and current_status != last_status:
            icon = "🟢" if current_status == "UP" else "🔴"
            message = f"Сервер: {HOST}:{PORT} {icon} {current_status}"
            send_telegram_message_to_all(message)
            send_discord_message(current_status)
            last_status = current_status

        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()