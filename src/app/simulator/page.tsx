import { Metadata } from 'next';
import SimulatorClient from './SimulatorClient';

export const metadata: Metadata = {
  title: 'Simulator QR Stempel & Live Demo | Loyalti',
  description:
    'Simulasi interaktif cara kerja platform loyalitas stempel Loyalti: dari pembuatan QR kasir hingga klaim stempel WhatsApp pelanggan.',
};

export default function SimulatorPage() {
  return <SimulatorClient />;
}
