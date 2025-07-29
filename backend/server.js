const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/api/status", (req, res) => {
  const path = "../monitor/server_log.txt";
  try {
    const lines = fs.readFileSync(path, "utf-8")
      .split("\n")
      .filter(Boolean)
      .reverse()
      .slice(0, 1000000);
    const parsed = lines.map(line => {
      const [time, ...rest] = line.split(" ");
      return {
        time: time.replace("[", "").replace("]", ""),
        status: rest.join(" ")
      };
    });
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: "Can't read logs." });
  }
});

app.listen(PORT, () => console.log(`🟢 API listening on ${PORT}`));
