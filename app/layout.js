import Providers from '../components/Providers';
import './globals.css';

export const metadata = {
  title: 'Amiya - Beziehungscoach',
  description: 'Dein persönlicher AI-Beziehungscoach für bewusste Beziehungspflege',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
