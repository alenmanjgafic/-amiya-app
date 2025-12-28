import { AuthProvider } from '../lib/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Amiya - Beziehungscoach',
  description: 'Dein persönlicher AI-Beziehungscoach für bewusste Beziehungspflege',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
