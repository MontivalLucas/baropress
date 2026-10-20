import { useState } from "react";
import { Button } from "@/components/ui/controls";
export function RecoveryReceipt({ code, onDone }: { code: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  return <section role="region" aria-label="Código de recuperação" className="space-y-4"><h2 className="font-semibold">Guarde seu código de recuperação</h2><p className="text-sm text-mute">Este código será exibido uma única vez. Guarde-o fora deste computador em local protegido. Ele permite redefinir sua senha sem internet e funciona uma única vez.</p><code className="block break-all select-all p-3 border border-line rounded-lg text-sm">{code}</code><label className="flex gap-2 text-sm"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)}/>Guardei o código em local seguro.</label><Button disabled={!saved} onClick={onDone}>Continuar</Button></section>;
}

