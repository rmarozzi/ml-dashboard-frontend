import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export const metadata: Metadata = {
  title: "ML Dash — Dashboard para vendedores do Mercado Livre",
  description: "Gerencie seus pedidos, calcule lucro real e analise seu desempenho no Mercado Livre.",
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
