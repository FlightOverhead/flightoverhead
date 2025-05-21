const airlineNames = {
    AAL: "American", DAL: "Delta", UAL: "United", SWA: "Southwest",
    FFT: "Frontier", NKS: "Spirit", JBU: "JetBlue", ASA: "Alaska",
    SKW: "SkyWest", FDX: "FedEx", UPS: "UPS", KAL: "Korean Air",
    BAW: "British", ACA: "Air Canada", AFR: "Air France", DLH: "Lufthansa",
    ANA: "All Nippon", JAL: "Japan Air", QFA: "Qantas", UAE: "Emirates",
    THY: "Turkish", EVA: "EVA Air", CSC: "China South", CCA: "Air China", GIA: "Garuda"
};

function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lon = parseFloat(searchParams.get("lon"));

    if (!lat || !lon) {
        return new Response(JSON.stringify({ error: "Missing lat or lon" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    const latFixed = lat.toFixed(4);
    const lonFixed = lon.toFixed(4);
    const url = `https://adsbexchange-com1.p.rapidapi.com/v2/lat/${latFixed}/lon/${lonFixed}/dist/10/`;

    try {
        console.log('Querying ADS-B:', url);

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
            }
        });

        if (!res.ok) throw new Error(`ADS-B Exchange returned ${res.status}`);

        const json = await res.json();

        if (!json.ac || json.ac.length === 0) {
            return new Response(JSON.stringify({ flights: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const filtered = json.ac.filter(ac =>
            ac.lat && ac.lon &&
            typeof ac.alt_baro === 'number' && isFinite(ac.alt_baro) && ac.alt_baro > 0 &&
            typeof ac.gs === 'number' && isFinite(ac.gs) && ac.gs > 0 &&
            typeof ac.seen === 'number' && ac.seen < 30
        );

        if (filtered.length === 0) {
            return new Response(JSON.stringify({ flights: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const closest = filtered.reduce((closestSoFar, ac) => {
            const distance = haversineDistance(lat, lon, ac.lat, ac.lon);
            return (!closestSoFar || distance < closestSoFar.distance)
                ? { ac, distance }
                : closestSoFar;
        }, null);

        const { ac: top } = closest;

        const rawCallsign = (top.callsign || "").trim().toUpperCase();
        const prefix = rawCallsign.slice(0, 3);
        const airline = airlineNames[prefix] ? airlineNames[prefix] : "PRIVATE";

        const flight = {
            icao24: top.hex || "",
            callsign: airline,
            altitude: top.alt_baro || 0,
            groundspeed: Math.round(top.gs || 0),
            heading: Math.round(top.track || 0),
            verticalRate: top.baro_rate || 0
        };

        return new Response(JSON.stringify({ flights: [flight] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("ADS-B RapidAPI error:", err);
        return new Response(JSON.stringify({ flights: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }
}
