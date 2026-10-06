import { createRoot } from 'react-dom/client';
import GlobalPolicyMap from './GlobalPolicyMap';

const mount = document.getElementById('policy-map');
if (mount) createRoot(mount).render(<GlobalPolicyMap />);
