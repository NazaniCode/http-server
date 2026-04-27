import express from "express";
import { config } from './config.js';
const app = express();
const PORT = 8080;
app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
//API endpoints
app.get("/admin/metrics", writeNumRequests);
app.post("/admin/reset", resetNumRequests);
app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", validateChirpHandler);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        const statusCode = res.statusCode;
        if (statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
        }
    });
    next();
}
function middlewareMetricsInc(req, res, next) {
    config.fileserverHits++;
    next();
}
function writeNumRequests(req, res, next) {
    res.set("Content-Type", "text/html; charset=utf-8");
    const html = `
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileserverHits} times!</p>
      </body>
    </html>
  `;
    res.send(html);
    next();
}
function resetNumRequests(req, res, next) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
    next();
}
async function validateChirpHandler(req, res) {
    res.set("Content-Type", "application/json");
    const parsedBody = req.body;
    if (parsedBody.body.length > 140) {
        res.status(400).send({ "error": "Chirp is too long" });
    }
    else {
        res.status(200).send({ "cleanedBody": censorString(parsedBody.body) });
    }
}
function censorString(str) {
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    const split = str.split(" ");
    for (let i = 0; i < split.length; i++) {
        if (badWords.includes(split[i].toLowerCase())) {
            split[i] = "****";
        }
    }
    return split.join(" ");
}
