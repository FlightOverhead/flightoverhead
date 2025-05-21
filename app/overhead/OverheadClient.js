'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OverheadClient() {
    const searchParams = useSearchParams();
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    const [flight, setFlight] = useState(null);
    const [previousFingerprint, setPreviousFingerprint] = useState(null);
    const [scrambleMap, setScrambleMap] = useState(Array(4).fill([]));
    const [wasNoFlight, setWasNoFlight] = useState(true);
    const scrambleIntervals = useRef([]);

    useEffect(() => {
        let interval;

        const fetchFlight = async () => {
            try {
                const res = await fetch(`/api/flight?lat=${lat}&lon=${lon}`);
                const data = await res.json();
                const newFlight = data.flights && data.flights.length > 0 ? data.flights[0] : null;
                const flightFingerprint = newFlight
                    ? `${newFlight.callsign}-${Math.round(newFlight.altitude)}-${Math.round(newFlight.heading)}`
                    : null;
                const isSameFlight = flightFingerprint === previousFingerprint;

                if (newFlight && wasNoFlight && !isSameFlight) {
                    const rows = [
                        formatCallsign(newFlight).padEnd(14, ' ').slice(0, 14).split(''),
                        (`ALT ${Math.round(newFlight.altitude || 0)}FT`).toUpperCase().padEnd(14, ' ').slice(0, 14).split(''),
                        (`SPD ${Math.round(newFlight.groundspeed || 0)}MPH`).toUpperCase().padEnd(14, ' ').slice(0, 14).split(''),
                        (`HDG ${getCompassDirection(newFlight.heading)} ${Math.round(newFlight.heading)}°`).toUpperCase().padEnd(14, ' ').slice(0, 14).split(''),
                    ];

                    const scrambleChars = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';
                    let updates = Array(4).fill(null).map(() => Array(14).fill(''));
                    setScrambleMap(updates);

                    for (let row = 0; row < 4; row++) {
                        for (let col = 0; col < 14; col++) {
                            const intervalId = setInterval(() => {
                                setScrambleMap(prev => {
                                    const updated = prev.map(arr => [...arr]);
                                    updated[row][col] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                                    return updated;
                                });
                            }, 50);

                            scrambleIntervals.current.push(setTimeout(() => {
                                clearInterval(intervalId);
                                setScrambleMap(prev => {
                                    const updated = prev.map(arr => [...arr]);
                                    updated[row][col] = rows[row][col];
                                    return updated;
                                });

                                if (row === 3 && col === 13) {
                                    setFlight(newFlight);
                                    setPreviousFingerprint(flightFingerprint);
                                    setWasNoFlight(false);
                                }
                            }, 1000));
                        }
                    }

                    return;
                }

                setFlight(newFlight);
                setPreviousFingerprint(flightFingerprint);
                setWasNoFlight(!newFlight);
            } catch (err) {
                console.error('API fetch failed:', err);
                setFlight(null);
                setWasNoFlight(true);
                setPreviousFingerprint(null);
                setScrambleMap(Array(4).fill([]));
            }
        };

        if (lat && lon) {
            fetchFlight();
            interval = setInterval(() => fetchFlight(), 20000);
        }

        return () => {
            clearInterval(interval);
            scrambleIntervals.current.forEach(clearTimeout);
        };
    }, [lat, lon]);

    const boxStyle = {
        width: '4rem',
        height: '5rem',
        background: '#393939',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: '700',
        fontSize: '4rem',
        fontFamily: 'IBM Plex Mono, monospace',
        borderRadius: '8px',
    };

    const getCompassDirection = (heading) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(heading / 45) % 8];
    };

    const formatCallsign = (flight) => {
        const callsign = flight.callsign?.trim();
        return callsign && callsign.length > 1 ? callsign.toUpperCase() : 'PRIVATE';
    };

    const renderTickerRow = (text, rowIndex) => {
        const chars = text.toUpperCase().padEnd(14, ' ').slice(0, 14).split('');
        const active = scrambleMap[rowIndex]?.length === 14;
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '0.5rem' }}>
                {chars.map((char, i) => (
                    <div key={i} style={boxStyle}>
                        {active ? scrambleMap[rowIndex][i] : char.trim() || ''}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <main
            style={{
                background: '#111',
                color: '#fff',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1rem',
                fontFamily: 'IBM Plex Mono, monospace',
            }}
        >
            {flight ? (
                <>
                    {renderTickerRow(formatCallsign(flight), 0)}
                    {renderTickerRow(`ALT ${Math.round(flight.altitude || 0)}FT`, 1)}
                    {renderTickerRow(`SPD ${Math.round(flight.groundspeed || 0)}MPH`, 2)}
                    {renderTickerRow(`HDG ${getCompassDirection(flight.heading)} ${Math.round(flight.heading)}°`, 3)}
                </>
            ) : (
                <>
                    {renderTickerRow('', 0)}
                    {renderTickerRow('NO', 1)}
                    {renderTickerRow('FLIGHT', 2)}
                    {renderTickerRow('OVERHEAD', 3)}
                </>
            )}
        </main>
    );
}
