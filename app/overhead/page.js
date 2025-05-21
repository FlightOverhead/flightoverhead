import { Suspense } from 'react';
import OverheadClient from './OverheadClient';

export default function OverheadPage() {
    return (
        <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center' }}>Loading flight data…</div>}>
            <OverheadClient />
        </Suspense>
    );
}
