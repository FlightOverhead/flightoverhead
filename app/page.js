'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from 'use-places-autocomplete';

export default function HomePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* You can bias the search here if desired */
        },
        debounce: 300,
    });

    const handleSelect = async (val) => {
        setLoading(true);
        setValue(val, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address: val });
            const { lat, lng } = await getLatLng(results[0]);
            router.push(`/overhead?lat=${lat}&lon=${lng}`);
        } catch (error) {
            console.error('Autocomplete geocoding error:', error);
            alert('Could not find location');
            setLoading(false);
        }
    };

    const handleUseLocation = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                router.push(`/overhead?lat=${latitude}&lon=${longitude}`);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location');
                setLoading(false);
            }
        );
    };

    return (
        <main style={{ padding: '2rem', textAlign: 'center', color: '#fff', background: '#111', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>What’s flying over you right now?</h1>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={!ready}
                    placeholder="Enter ZIP or address"
                    style={{
                        padding: '0.75rem',
                        fontSize: '1.25rem',
                        width: '80%',
                        maxWidth: '400px',
                        borderRadius: '8px',
                    }}
                />
                {status === 'OK' && (
                    <ul style={{
                        background: '#222',
                        color: '#fff',
                        listStyle: 'none',
                        margin: 0,
                        padding: '0.5rem',
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '8px',
                        zIndex: 10
                    }}>
                        {data.map(({ place_id, description }) => (
                            <li
                                key={place_id}
                                onClick={() => handleSelect(description)}
                                style={{ padding: '0.5rem', cursor: 'pointer' }}
                            >
                                {description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <button
                onClick={handleUseLocation}
                disabled={loading}
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
                Use My Location
            </button>
        </main>
    );
}
