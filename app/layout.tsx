import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export const metadata: Metadata = {
  title: "Vendix — Vendas de todos os canais, um painel",
  description: "Gerencie pedidos, calcule lucro real e analise seu desempenho em todos os canais de venda, em um painel só.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <PlanProvider>
            <PermissionsProvider>
              {children}
            </PermissionsProvider>
          </PlanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
