require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Charger les données d'index glycémique
const igData = JSON.parse(fs.readFileSync(path.join(__dirname, 'IG.json'), 'utf8'));

const NUTRITIONIX_BASE_URL = 'https://trackapi.nutritionix.com/v2';
const headers = {
    'x-app-id': process.env.NUTRITIONIX_APP_ID,
    'x-app-key': process.env.NUTRITIONIX_API_KEY,
    'Content-Type': 'application/json'
};

// Route pour la recherche d'aliments en français
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Le paramètre query est requis' });
        }

        const response = await fetch(
            `${NUTRITIONIX_BASE_URL}/search/instant/?locale=fr_FR&query=${encodeURIComponent(query)}`,
            { headers }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur lors de la recherche d\'aliments' });
    }
});

// Route pour obtenir les informations nutritionnelles détaillées d'un aliment
app.get('/api/food-info', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Le paramètre query est requis' });
        }

        const response = await fetch(
            `${NUTRITIONIX_BASE_URL}/natural/nutrients`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: query,
                    locale: 'fr_FR'
                })
            }
        );
        const data = await response.json();

        // Rechercher l'index glycémique
        let indexGlycemique = null;
        const queryLower = query.toLowerCase();
        
        // Chercher une correspondance exacte ou partielle dans les données IG
        for (const [aliment, ig] of Object.entries(igData)) {
            if (aliment.toLowerCase() === queryLower || 
                aliment.toLowerCase().includes(queryLower) || 
                queryLower.includes(aliment.toLowerCase())) {
                indexGlycemique = {
                    aliment: aliment,
                    ig: ig
                };
                break;
            }
        }

        // Ajouter l'index glycémique à la réponse s'il est trouvé
        const response_data = {
            ...data,
            index_glycemique: indexGlycemique
        };

        res.json(response_data);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations de l\'aliment' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
