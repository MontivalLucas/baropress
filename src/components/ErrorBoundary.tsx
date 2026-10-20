import { Component, type ReactNode } from "react";
import { Button } from "./ui/controls";
import { api } from "@/services/database/api";
import { useSession } from "@/stores/session";
export class ErrorBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { void api.logs.add('interface', 'Falha ao apresentar uma tela.', 'error').catch(() => { }); }
    render() {
        if (!this.state.failed)
            return this.props.children;
        return <div role="alert" className="p-6 space-y-3"><h1 className="text-xl font-semibold">Não foi possível apresentar esta tela.</h1><p className="text-sm text-mute">Volte ao dashboard e tente abrir o módulo novamente.</p><Button onClick={() => useSession.getState().go('dashboard')}>Voltar ao dashboard</Button></div>;
    }
}
