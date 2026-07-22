import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Trophy, Skull, Edit2, Trash2, Plus, Calendar, User, Shield } from "lucide-react";
import { useState } from "react";

export default function Honor() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const { data: members, isLoading, refetch } = trpc.honor.list.useQuery();
  const createMutation = trpc.honor.create.useMutation({
    onSuccess: () => { toast.success("Membro adicionado à Seção de Honra!"); refetch(); setShowCreate(false); },
    onError: () => toast.error("Erro ao criar"),
  });
  const updateMutation = trpc.honor.update.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); refetch(); setEditing(null); },
    onError: () => toast.error("Erro ao atualizar"),
  });
  const deleteMutation = trpc.honor.delete.useMutation({
    onSuccess: () => { toast.success("Removido!"); refetch(); setEditing(null); },
    onError: () => toast.error("Erro ao remover"),
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/manus-storage/pasted_file_gU1gjQ_WhatsAppImage2026-07-02at00.01.36.jpeg_8b8a4c0a.jpeg')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-military-bg/80 to-military-bg" />
        <div className="container px-4 relative">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-green-neon mx-auto mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-green-neon tracking-wider text-glow mb-4">
              SEÇÃO DE HONRA
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Homageando os membros que deixaram sua marca na Liga Anônima de Airsoft.
              Seus feitos e legado serão lembrados para sempre.
            </p>
          </div>
        </div>
      </section>

      {/* Liga History */}
      <section className="container px-4 py-12">
        <Card className="bg-military-surface border-green-neon/20">
          <CardContent className="p-8">
            <h2 className="font-display text-2xl text-green-neon tracking-wider mb-6 text-center">
              A HISTÓRIA DA L.A.A.
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
              <p className="text-base leading-relaxed">
                A <strong className="text-green-neon">Liga Anônima de Airsoft</strong> nasceu da paixão de um grupo de operadores
                que buscavam mais do que apenas jogar — buscavam forjar laços de irmandade no campo de batalha simulado.
              </p>
              <p className="text-base leading-relaxed">
                Fundada com o espírito de camaradagem e honra, a L.A.A. rapidamente se tornou referência na região.
                O nome "Anônima" remete à origem humilde: não buscávamos reconhecimento externo, apenas a satisfação
                de sermos os melhores dentro do campo.
              </p>
              <p className="text-base leading-relaxed">
                Ao longo dos anos, a Liga cresceu e atraiu operadores de diversas origens. Membros que se destacaram
                pela coragem, estratégia e lealdade foram eternizados nesta Seção de Honra, para que as novas gerações
                saibam de onde vieram e o que é esperado de cada operador da L.A.A.
              </p>
              <p className="text-base leading-relaxed italic text-green-neon/60 border-l-2 border-green-neon/30 pl-4">
                "No campo, somos iguais. Na honra, somos eternos."
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="container px-4 mb-6">
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-green-neon text-military-bg font-display tracking-wider"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Membro à Seção de Honra
          </Button>
        </div>
      )}

      {/* Members Grid */}
      <section className="container px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-80 bg-military-surface rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members?.map((m: any) => (
              <Card
                key={m.id}
                className="bg-military-surface border-military-border hover:border-green-neon/30 transition-colors cursor-pointer"
                onClick={() => setSelected(m.id)}
              >
                <div className="relative">
                  {m.photoUrl ? (
                    <img
                      src={m.photoUrl}
                      alt={m.name}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-military-bg flex items-center justify-center">
                      <Skull className="w-16 h-16 text-green-neon/30" />
                    </div>
                  )}
                  {m.isDeceased && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10">
                        In Memoriam
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-display text-lg text-green-neon tracking-wider">{m.name}</h3>
                  {m.nickname && (
                    <p className="text-xs text-muted-foreground mt-1">"{m.nickname}"</p>
                  )}
                  {m.role && (
                    <p className="text-xs text-green-neon/70 mt-1 font-display tracking-wider">{m.role}</p>
                  )}
                  {m.yearsActive && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {m.yearsActive}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!isLoading && (!members || members.length === 0) && (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-green-neon/20 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum membro na Seção de Honra ainda.</p>
            {isAdmin && <p className="text-xs text-muted-foreground mt-2">Use o botão acima para adicionar.</p>}
          </div>
        )}
      </section>

      {/* Create Dialog */}
      {isAdmin && (
        <HonorFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate(data)}
          title="Novo Membro na Seção de Honra"
        />
      )}

      {/* Edit Dialog */}
      {isAdmin && editing !== null && (
        <HonorFormDialog
          open={editing !== null}
          onOpenChange={() => setEditing(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editing, ...data })}
          onDelete={() => deleteMutation.mutate({ id: editing })}
          title="Editar Membro"
          isEdit
        />
      )}

      {/* Detail Dialog */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-military-surface border-military-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-green-neon tracking-wider text-xl">
              {members?.find((m: any) => m.id === selected)?.name}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const m = members?.find((x: any) => x.id === selected);
            if (!m) return null;
            return (
              <div className="space-y-4">
                {m.photoUrl && (
                  <img src={m.photoUrl} alt={m.name} className="w-full h-64 object-cover rounded-lg" />
                )}
                <div className="flex flex-wrap gap-2">
                  {m.nickname && (
                    <Badge variant="outline" className="border-green-neon/50 text-green-neon">
                      "{m.nickname}"
                    </Badge>
                  )}
                  {m.role && (
                    <Badge variant="outline" className="border-green-neon/50 text-green-neon">
                      {m.role}
                    </Badge>
                  )}
                  {m.yearsActive && (
                    <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                      {m.yearsActive}
                    </Badge>
                  )}
                  {m.isDeceased && (
                    <Badge variant="outline" className="border-red-500 text-red-500">
                      In Memoriam
                    </Badge>
                  )}
                </div>
                {m.biography && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{m.biography}</p>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      className="bg-green-neon/20 text-green-neon border border-green-neon/30"
                      onClick={() => { setSelected(null); setEditing(m.id); }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: m.id }, { onSuccess: () => { setSelected(null); } })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remover
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============ FORM DIALOG ============ */
function HonorFormDialog({
  open, onOpenChange, onSubmit, onDelete, title, isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  title: string;
  isEdit?: boolean;
}) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [biography, setBiography] = useState("");
  const [yearsActive, setYearsActive] = useState("");
  const [role, setRole] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);

  const handleSubmit = () => {
    if (!name) { toast.error("Nome é obrigatório"); return; }
    onSubmit({ name, nickname: nickname || null, photoUrl: photoUrl || null, biography: biography || null, yearsActive: yearsActive || null, role: role || null, isDeceased });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-military-surface border-military-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-green-neon tracking-wider text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-display tracking-wider text-foreground">Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-military-bg border-military-border text-foreground" />
          </div>
          <div>
            <Label className="text-xs font-display tracking-wider text-foreground">Apelido</Label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} className="bg-military-bg border-military-border text-foreground" />
          </div>
          <div>
            <Label className="text-xs font-display tracking-wider text-foreground">Foto (URL)</Label>
            <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." className="bg-military-bg border-military-border text-foreground" />
          </div>
          <div>
            <Label className="text-xs font-display tracking-wider text-foreground">Biografia</Label>
            <textarea rows={4} value={biography} onChange={e => setBiography(e.target.value)} placeholder="História e conquistas do membro..." className="w-full bg-military-bg border border-military-border text-foreground rounded-md p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-display tracking-wider text-foreground">Anos Ativo</Label>
              <Input value={yearsActive} onChange={e => setYearsActive(e.target.value)} placeholder="ex: 2018-2022" className="bg-military-bg border-military-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs font-display tracking-wider text-foreground">Função</Label>
              <Input value={role} onChange={e => setRole(e.target.value)} placeholder="ex: Sniper, Líder..." className="bg-military-bg border-military-border text-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isDeceased} onChange={e => setIsDeceased(e.target.checked)} className="accent-green-neon" />
            <Label className="text-xs text-foreground">In Memoriam (falecido)</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="bg-green-neon text-military-bg font-display tracking-wider flex-1">
              {isEdit ? "Salvar" : "Adicionar"}
            </Button>
            {isEdit && onDelete && (
              <Button variant="destructive" onClick={onDelete}>Remover</Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
