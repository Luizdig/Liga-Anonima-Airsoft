import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Calendar, Newspaper, Images, ShoppingCart, Ban, ShieldOff, Trash2, Edit2, Settings, Activity, TrendingUp, DollarSign, Upload, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Acesso restrito a administradores");
    }
  }, [user]);

  if (!user || user.role !== "admin") {
    return (
      <div className="container px-4 py-20 text-center">
        <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="font-display text-2xl text-destructive tracking-wider">ACESSO NEGADO</h1>
        <p className="text-muted-foreground mt-2">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-green-neon" />
        <div>
          <h1 className="font-display text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
            PAINEL ADMINISTRATIVO
          </h1>
          <p className="text-muted-foreground">Gerencie a liga e seus membros</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-military-surface border border-military-border w-full flex-wrap md:flex-nowrap overflow-x-auto gap-1 p-1">
          {/* TabsList with horizontal scroll on mobile */}
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Activity className="w-3 h-3 mr-1" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Users className="w-3 h-3 mr-1" /> Membros
          </TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Calendar className="w-3 h-3 mr-1" /> Jogos
          </TabsTrigger>
          <TabsTrigger value="feed" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Newspaper className="w-3 h-3 mr-1" /> Feed
          </TabsTrigger>
          <TabsTrigger value="media" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Images className="w-3 h-3 mr-1" /> Mídia
          </TabsTrigger>
          <TabsTrigger value="store" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <ShoppingCart className="w-3 h-3 mr-1" /> Loja
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Settings className="w-3 h-3 mr-1" /> Configurações
          </TabsTrigger>
          <TabsTrigger value="honor" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <Star className="w-3 h-3 mr-1" /> Honra
          </TabsTrigger>
          <TabsTrigger value="pix" className="data-[state=active]:bg-green-neon data-[state=active]:text-military-bg font-display text-xs tracking-wider shrink-0">
            <DollarSign className="w-3 h-3 mr-1" /> PIX
          </TabsTrigger>
        </TabsList>

        {/* Honor Tab */}
        <TabsContent value="honor">
          <HonorPanel />
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <DashboardPanel />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games">
          <GamesPanel />
        </TabsContent>

        {/* Feed Tab */}
        <TabsContent value="feed">
          <FeedPanel />
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaPanel />
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store">
          <StorePanel />
        </TabsContent>

        {/* PIX Tab */}
        <TabsContent value="pix">
          <PixPanel />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============ USERS PANEL ============ */
function UsersPanel() {
  const { data: rawUsers, isLoading, refetch } = trpc.admin.users.list.useQuery();
  const users: any[] = (rawUsers as any[]) || [];
  const banMutation = trpc.admin.users.ban.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: () => toast.error("Erro ao atualizar"),
  });
  const promoteMutation = trpc.admin.users.promote.useMutation({
    onSuccess: () => { toast.success("Promovido a ADM!"); refetch(); },
    onError: () => toast.error("Erro ao promover"),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <Card className="bg-military-surface border-military-border">
      <CardHeader>
        <CardTitle className="font-display text-green-neon tracking-wider">
          Gerenciar Membros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-military-border">
                <th className="text-left py-3 px-4 text-green-neon font-display text-xs tracking-wider">NOME</th>
                <th className="text-left py-3 px-4 text-green-neon font-display text-xs tracking-wider">EMAIL</th>
                <th className="text-left py-3 px-4 text-green-neon font-display text-xs tracking-wider">FUNÇÃO</th>
                <th className="text-left py-3 px-4 text-green-neon font-display text-xs tracking-wider">STATUS</th>
                <th className="text-left py-3 px-4 text-green-neon font-display text-xs tracking-wider">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-military-border/50 hover:bg-accent-green/5">
                  <td className="py-3 px-4 text-foreground">{u.name || "Sem nome"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{u.email || "-"}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={u.role === "admin" ? "border-green-neon text-green-neon" : "border-muted-foreground text-muted-foreground"}>
                      {u.role === "admin" ? "ADMIN" : "MEMBRO"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={u.banned ? "border-destructive text-destructive" : "border-green-neon/50 text-green-neon"}>
                      {u.banned ? "BANIDO" : "ATIVO"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => banMutation.mutate({ userId: u.id, banned: !u.banned })}
                      className={u.banned ? "text-green-neon hover:bg-green-neon/10" : "text-destructive hover:bg-destructive/10"}
                    >
                      {u.banned ? <ShieldOff className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      <span className="ml-2 text-xs">{u.banned ? "Desbanir" : "Banir"}</span>
                    </Button>
                    {u.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => promoteMutation.mutate({ userId: u.id })}
                        className="text-green-neon hover:bg-green-neon/10 border border-green-neon/30"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="ml-2 text-xs">Promover</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============ GAMES PANEL ============ */
function GamesPanel() {
  const { data: games, isLoading, refetch } = trpc.games.all.useQuery();
  const deleteMutation = trpc.games.delete.useMutation({
    onSuccess: () => { toast.success("Jogo removido!"); refetch(); },
    onError: () => toast.error("Erro ao remover"),
  });
  const createMutation = trpc.games.create.useMutation({
    onSuccess: () => { toast.success("Jogo criado!"); refetch(); },
    onError: () => toast.error("Erro ao criar"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [gameForm, setGameForm] = useState({
    title: "", location: "", gameDate: "", value: "", maxPlayers: "30", description: ""
  });

  const handleCreateGame = () => {
    if (!gameForm.title || !gameForm.location || !gameForm.gameDate) {
      toast.error("Preencha título, local e data");
      return;
    }
    createMutation.mutate({
      title: gameForm.title,
      location: gameForm.location,
      gameDate: new Date(gameForm.gameDate).toISOString(),
      value: gameForm.value || undefined,
      maxPlayers: parseInt(gameForm.maxPlayers) || 30,
      description: gameForm.description || undefined,
    });
    setShowCreate(false);
    setGameForm({ title: "", location: "", gameDate: "", value: "", maxPlayers: "30", description: "" });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      {!showCreate && (
        <Button onClick={() => setShowCreate(true)} className="bg-green-neon text-military-bg font-display tracking-wider">
          <Calendar className="w-4 h-4 mr-2" /> Criar Novo Jogo
        </Button>
      )}
      {showCreate && (
        <Card className="bg-military-surface border-green-neon/30">
          <CardHeader>
            <CardTitle className="font-display text-green-neon tracking-wider text-lg">Novo Jogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs font-display tracking-wider text-foreground">Título</Label>
              <Input value={gameForm.title} onChange={e => setGameForm({...gameForm, title: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div><Label className="text-xs font-display tracking-wider text-foreground">Local</Label>
              <Input value={gameForm.location} onChange={e => setGameForm({...gameForm, location: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div><Label className="text-xs font-display tracking-wider text-foreground">Data</Label>
              <Input type="datetime-local" value={gameForm.gameDate} onChange={e => setGameForm({...gameForm, gameDate: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div className="flex gap-4">
              <div className="flex-1"><Label className="text-xs font-display tracking-wider text-foreground">Valor (R$)</Label>
                <Input value={gameForm.value} onChange={e => setGameForm({...gameForm, value: e.target.value})} placeholder="Gratuito" className="bg-military-bg border-military-border text-foreground" /></div>
              <div className="w-32"><Label className="text-xs font-display tracking-wider text-foreground">Vagas</Label>
                <Input type="number" value={gameForm.maxPlayers} onChange={e => setGameForm({...gameForm, maxPlayers: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            </div>
            <div><Label className="text-xs font-display tracking-wider text-foreground">Descrição</Label>
              <Input value={gameForm.description} onChange={e => setGameForm({...gameForm, description: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div className="flex gap-3">
              <Button onClick={handleCreateGame} className="bg-green-neon text-military-bg font-display tracking-wider">Criar Jogo</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">Jogos Agendados ({games?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {games?.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-4 border border-military-border rounded-lg hover:border-green-neon/30 transition-colors">
                <div>
                  <p className="font-display text-sm text-green-neon tracking-wider">{game.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(game.gameDate).toLocaleDateString("pt-BR")} - {game.location} - R$ {game.value || "Gratuito"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: game.id })} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(!games || games.length === 0) && (
              <p className="text-center text-muted-foreground py-8">Nenhum jogo cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ FEED PANEL ============ */
function FeedPanel() {
  const { data: posts, isLoading, refetch } = trpc.feed.get.useQuery();
  const deleteMutation = trpc.feed.delete.useMutation({
    onSuccess: () => { toast.success("Publicação removida!"); refetch(); },
    onError: () => toast.error("Erro ao remover"),
  });
  const createMutation = trpc.feed.create.useMutation({
    onSuccess: () => { toast.success("Publicação criada!"); refetch(); },
    onError: () => toast.error("Erro ao criar"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "", mediaUrls: "", mediaType: "none" as "none" | "image" | "video" | "mixed" });

  const handleCreatePost = () => {
    if (!postForm.content) { toast.error("Digite o conteúdo"); return; }
    const urls = postForm.mediaUrls.split('\n').filter(u => u.trim()).map(u => u.trim());
    createMutation.mutate({
      title: postForm.title || undefined,
      content: postForm.content,
      mediaUrls: urls.length > 0 ? urls : undefined,
      mediaType: urls.length > 0 ? (urls.some(u => u.includes('.mp4') || u.includes('.webm')) ? 'video' : 'image') as any : 'none',
    });
    setShowCreate(false);
    setPostForm({ title: "", content: "", mediaUrls: "", mediaType: "none" });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      {!showCreate && (
        <Button onClick={() => setShowCreate(true)} className="bg-green-neon text-military-bg font-display tracking-wider">
          <Newspaper className="w-4 h-4 mr-2" /> Nova Publicação
        </Button>
      )}
      {showCreate && (
        <Card className="bg-military-surface border-green-neon/30">
          <CardHeader><CardTitle className="font-display text-green-neon tracking-wider text-lg">Nova Publicação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs font-display tracking-wider text-foreground">Título</Label>
              <Input value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div><Label className="text-xs font-display tracking-wider text-foreground">Conteúdo</Label>
              <Input value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="bg-military-bg border-military-border text-foreground" /></div>
            <div><Label className="text-xs font-display tracking-wider text-foreground">URLs de mídia (uma por linha)</Label>
              <textarea rows={3} value={postForm.mediaUrls} onChange={e => setPostForm({...postForm, mediaUrls: e.target.value})} placeholder="Cole URLs de imagens ou vídeos aqui, uma por linha..." className="w-full bg-military-bg border border-military-border text-foreground rounded-md p-2 text-sm" /></div>
            <div className="flex gap-3">
              <Button onClick={handleCreatePost} className="bg-green-neon text-military-bg font-display tracking-wider">Publicar</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">Publicações ({posts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts?.map((post) => (
              <div key={post.id} className="flex items-start justify-between p-4 border border-military-border rounded-lg">
                <div>
                  <p className="font-display text-sm text-green-neon tracking-wider">{post.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Por: {post.authorName || "L.A.A."} - {new Date(post.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: post.id })} className="text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(!posts || posts.length === 0) && (
              <p className="text-center text-muted-foreground py-8">Nenhuma publicação.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ MEDIA PANEL ============ */
function MediaPanel() {
  const { data: pending, isLoading, refetch } = trpc.media.pending.useQuery();
  const { data: approved, isLoading: approvedLoading } = trpc.media.approved.useQuery();

  const approveMutation = trpc.media.approve.useMutation({
    onSuccess: () => { toast.success("Aprovado!"); refetch(); },
  });
  const rejectMutation = trpc.media.reject.useMutation({
    onSuccess: () => { toast.success("Rejeitado!"); refetch(); },
  });
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => { toast.success("Removido!"); refetch(); },
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      {/* Pending */}
      <Card className="bg-military-surface border-yellow-500/30">
        <CardHeader>
          <CardTitle className="font-display text-yellow-500 tracking-wider">
            Pendentes de Aprovação ({pending?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending?.map((item) => (
              <div key={item.id} className="border border-yellow-500/20 rounded-lg overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  {item.mediaType === "video" ? (
                    <div className="w-full h-full bg-military-bg flex items-center justify-center">
                      <p className="text-green-neon text-sm">Vídeo</p>
                    </div>
                  ) : (
                    <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">Por: {item.authorName}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => approveMutation.mutate({ id: item.id })} className="bg-green-neon text-military-bg text-xs">
                      Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ id: item.id })} className="text-xs">
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!pending || pending.length === 0) && (
              <p className="col-span-full text-center text-muted-foreground py-4">Nenhum item pendente.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved */}
      <Card className="bg-military-surface border-green-neon/20">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">
            Galeria Aprovada ({approved?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {approved?.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded overflow-hidden border border-military-border">
                  <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate({ id: item.id })}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ STORE PANEL ============ */
function StorePanel() {
  const { data: rawItems, isLoading, refetch } = trpc.store.all.useQuery();
  const items: any[] = (rawItems as any[]) || [];
  const deleteMutation = trpc.store.delete.useMutation({
    onSuccess: () => { toast.success("Removido!"); refetch(); },
    onError: () => toast.error("Erro ao remover"),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <Card className="bg-military-surface border-military-border">
      <CardHeader>
        <CardTitle className="font-display text-green-neon tracking-wider">
          Gerenciar Loja ({items?.length || 0} anúncios)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border border-military-border rounded-lg hover:border-green-neon/30 transition-colors">
              <div className="flex items-center gap-4">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-military-bg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-green-dim/30" />
                  </div>
                )}
                <div>
                  <p className="font-display text-sm text-green-neon tracking-wider">{item.title}</p>
                  <p className="text-xs text-muted-foreground">R$ {item.price} - {item.sellerName} - {item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "active" ? "default" : "secondary"} className={item.status === "active" ? "bg-green-neon text-military-bg" : "bg-yellow-500 text-military-bg"}>
                  {item.status === "active" ? "ATIVO" : "VENDIDO"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: item.id })} className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-center text-muted-foreground py-8">Nenhum anúncio na loja.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============ SETTINGS PANEL ============ */
function SettingsPanel() {
  const { data: settings, isLoading, refetch } = trpc.admin.settings.getAll.useQuery();
  const setSettingMutation = trpc.admin.settings.update.useMutation({
    onSuccess: () => { toast.success("Configuração salva!"); refetch(); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const commissionEnabled = settings?.find(s => s.key === "commission_enabled")?.value === "true";
  const commissionRate = settings?.find(s => s.key === "commission_rate")?.value || "5";
  const adminMasterEmail = settings?.find(s => s.key === "admin_master_email")?.value || "";

  const [localCommission, setLocalCommission] = useState(commissionEnabled);
  const [localRate, setLocalRate] = useState(commissionRate);
  const [localAdminEmail, setLocalAdminEmail] = useState(adminMasterEmail);

  const handleToggle = () => {
    const newVal = !localCommission;
    setLocalCommission(newVal);
    setSettingMutation.mutate({ key: "commission_enabled", value: newVal ? "true" : "false" });
  };

  const handleRateChange = () => {
    setSettingMutation.mutate({ key: "commission_rate", value: localRate });
  };

  const handleAdminEmailChange = () => {
    setSettingMutation.mutate({ key: "admin_master_email", value: localAdminEmail });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">
            Configurações da Loja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground font-display text-sm tracking-wider">
                TAXA DE COMISSÃO (5%)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Quando ativo, cada venda gera uma taxa de 5% que deve ser doada para manutenção do site.
                Emails são enviados ao vendedor e ao ADM Master.
              </p>
            </div>
            <Switch checked={localCommission} onCheckedChange={handleToggle} className="data-[state=checked]:bg-green-neon" />
          </div>
          <Separator className="bg-military-border" />
          <div>
            <Label className="text-foreground font-display text-xs tracking-wider">TAXA ATUAL (%)</Label>
            <Input
              type="number"
              value={localRate}
              onChange={e => setLocalRate(e.target.value)}
              onBlur={handleRateChange}
              className="bg-military-bg border-military-border text-foreground w-32"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Altere o percentual de comissão. Padrão: 5%
            </p>
          </div>
          <Separator className="bg-military-border" />
          <div>
            <Label className="text-foreground font-display text-xs tracking-wider">EMAIL ADM MASTER</Label>
            <Input
              type="email"
              value={localAdminEmail}
              onChange={e => setLocalAdminEmail(e.target.value)}
              onBlur={handleAdminEmailChange}
              placeholder="admin@laa.com.br"
              className="bg-military-bg border-military-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email que receberá notificações de todas as compras realizadas na loja.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">
            Todas as Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings?.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-military-border rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.key}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                <p className="text-sm text-green-neon font-mono">{s.value || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ DASHBOARD PANEL ============ */
function DashboardPanel() {
  const { data: rawUsers, isLoading: usersLoading } = trpc.admin.users.list.useQuery();
  const users: any[] = (rawUsers as any[]) || [];
  const { data: games, isLoading: gamesLoading } = trpc.games.all.useQuery();
  const { data: posts, isLoading: postsLoading } = trpc.feed.get.useQuery();
  const { data: pendingMedia, isLoading: mediaLoading } = trpc.media.pending.useQuery();
  const { data: storeItems, isLoading: storeLoading } = trpc.store.all.useQuery();

  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => (u as any).role === "admin").length || 0;
  const bannedCount = users?.filter(u => (u as any).banned).length || 0;
  const activeUsers = totalUsers - bannedCount;
  const totalGames = games?.length || 0;
  const totalPosts = posts?.length || 0;
  const pendingCount = pendingMedia?.length || 0;
  const totalItems = storeItems?.length || 0;
  const activeItems = (storeItems as any[])?.filter(i => i.status === "active").length || 0;

  if (usersLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-military-surface border-green-neon/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-display tracking-wider text-muted-foreground">TOTAL MEMBROS</p>
                <p className="text-3xl font-bold text-green-neon mt-1">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">{activeUsers} ativos | {adminCount} admins</p>
              </div>
              <Users className="w-10 h-10 text-green-neon/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-military-surface border-green-neon/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-display tracking-wider text-muted-foreground">JOGOS</p>
                <p className="text-3xl font-bold text-green-neon mt-1">{totalGames}</p>
                <p className="text-xs text-muted-foreground mt-1">agendados</p>
              </div>
              <Calendar className="w-10 h-10 text-green-neon/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-military-surface border-green-neon/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-display tracking-wider text-muted-foreground">PUBLICAÇÕES</p>
                <p className="text-3xl font-bold text-green-neon mt-1">{totalPosts}</p>
                <p className="text-xs text-muted-foreground mt-1">no feed</p>
              </div>
              <Newspaper className="w-10 h-10 text-green-neon/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-military-surface border-green-neon/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-display tracking-wider text-muted-foreground">LOJA</p>
                <p className="text-3xl font-bold text-green-neon mt-1">{activeItems}</p>
                <p className="text-xs text-muted-foreground mt-1">{totalItems} anúncios</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-green-neon/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {pendingCount > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="font-display text-sm text-yellow-500 tracking-wider">
                  {pendingCount} MÍDIA(S) PENDENTE(S) DE APROVAÇÃO
                </p>
                <p className="text-xs text-muted-foreground">
                  Acesse a aba de Mídia para aprovar ou rejeitar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">
            Resumo Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-military-border rounded-lg">
              <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">MEMBROS BANIDOS</p>
              <p className="text-2xl font-bold text-destructive">{bannedCount}</p>
            </div>
            <div className="p-4 border border-military-border rounded-lg">
              <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">ITENS VENDIDOS</p>
              <p className="text-2xl font-bold text-green-neon">{totalItems - activeItems}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/* ============ HONOR PANEL ============ */
import { useRef } from "react";

function HonorPanel() {
  const { data: honoredMembers, isLoading, refetch } = trpc.honor.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    bio: "",
    yearsActive: "",
    imageUrl: "",
    isMemorial: false,
  });
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.media.uploadFile.useMutation({
    onSuccess: (data) => {
      setUploadedImage((data as any).mediaUrl || "");
      toast.success("Foto enviada!");
    },
    onError: () => { toast.error("Erro ao enviar foto"); },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Foto muito grande (max 10MB)"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) { setUploading(false); return; }
      uploadMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
        mediaType: "image",
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const createMutation = trpc.honor.create.useMutation({
    onSuccess: () => {
      toast.success("Membro honorificado adicionado!");
      setShowForm(false);
      setFormData({ name: "", nickname: "", bio: "", yearsActive: "", imageUrl: "", isMemorial: false });
      setUploadedImage("");
      refetch();
    },
    onError: () => toast.error("Erro ao adicionar"),
  });

  const deleteMutation = trpc.honor.delete.useMutation({
    onSuccess: () => {
      toast.success("Removido com sucesso!");
      refetch();
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleSubmit = () => {
    if (!formData.name) { toast.error("Nome é obrigatório"); return; }
    createMutation.mutate({
      name: formData.name,
      nickname: formData.nickname || undefined,
      biography: formData.bio || undefined,
      yearsActive: formData.yearsActive || undefined,
      photoUrl: uploadedImage || formData.imageUrl || undefined,
      isDeceased: formData.isMemorial,
    });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-green-neon tracking-wider">SEÇÃO DE HONRA</h2>
          <p className="text-sm text-muted-foreground">Gerencie membros honorificados e memorial</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-neon text-military-bg font-display text-xs tracking-wider">
          <Star className="w-4 h-4 mr-2" /> ADICIONAR
        </Button>
      </div>

      {showForm && (
        <Card className="bg-military-surface border-green-neon/30 glow-border">
          <CardHeader>
            <CardTitle className="font-display text-green-neon tracking-wider text-sm">Novo Membro Honorificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">NOME</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nome completo" className="bg-military-bg border-military-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">APELIDO</Label>
                <Input value={formData.nickname} onChange={e => setFormData({ ...formData, nickname: e.target.value })} placeholder="Apelido" className="bg-military-bg border-military-border text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">BIOGRAFIA</Label>
              <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte a história deste membro..." className="bg-military-bg border-military-border text-foreground" rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">ANOS ATIVOS</Label>
                <Input value={formData.yearsActive} onChange={e => setFormData({ ...formData, yearsActive: e.target.value })} placeholder="Ex: 2018 - 2023" className="bg-military-bg border-military-border text-foreground" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.isMemorial} onCheckedChange={v => setFormData({ ...formData, isMemorial: v })} />
                <Label className="text-destructive font-display text-xs tracking-wider">MEMORIAL (In Memoriam)</Label>
              </div>
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider mb-2 block">FOTO (OPCIONAL)</Label>
              <div className="flex items-center gap-4">
                {uploadedImage && (
                  <div className="relative">
                    <img src={uploadedImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-military-border" />
                    <button onClick={() => setUploadedImage("")} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-neon/30 rounded-lg hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50">
                  {uploading ? <div className="animate-spin w-5 h-5 border-2 border-green-neon border-t-transparent rounded-full" /> : <Upload className="w-5 h-5 text-green-neon/50" />}
                  <span className="text-sm text-foreground">{uploadedImage ? "Trocar" : "Upload"}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-green-neon text-military-bg font-display text-xs tracking-wider">SALVAR</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-military-border text-xs">CANCELAR</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(honoredMembers as any[] || []).map((m: any) => (
          <Card key={m.id} className="bg-military-surface border-military-border glow-border-hover">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {m.imageUrl && (
                  <img src={m.imageUrl} alt={m.name} className="w-16 h-16 rounded-lg object-cover border border-military-border" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm text-green-neon tracking-wider">{m.name}</h3>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: m.id })} className="text-destructive hover:bg-destructive/10 w-6 h-6 p-0"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  {m.nickname && <p className="text-xs text-muted-foreground">"{m.nickname}"</p>}
                  {m.yearsActive && <p className="text-xs text-muted-foreground mt-1">{m.yearsActive}</p>}
                  {m.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{m.bio}</p>}
                  {m.isMemorial && <Badge className="mt-2 bg-destructive/20 text-destructive text-[10px]">IN MEMORIAM</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!honoredMembers || honoredMembers.length === 0) && (
          <div className="col-span-full text-center py-8">
            <Star className="w-12 h-12 text-green-dim/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum membro honorificado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ============ PIX PANEL ============ */
function PixPanel() {
  const { data: games, isLoading: gamesLoading } = trpc.games.all.useQuery();
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [pixKey, setPixKey] = useState("");
  const [showPixForm, setShowPixForm] = useState(false);

  const setPixKeyMutation = trpc.games.setPixKey.useMutation({
    onSuccess: () => {
      toast.success("Chave PIX salva com sucesso!");
      setPixKey("");
      setShowPixForm(false);
    },
    onError: () => toast.error("Erro ao salvar chave PIX"),
  });

  const getPixKeyQuery = trpc.games.getPixKey.useQuery(
    { gameId: selectedGameId || 0 },
    { enabled: !!selectedGameId }
  );

  const getPaymentProofsQuery = trpc.games.getPaymentProofs.useQuery(
    { gameId: selectedGameId || 0 },
    { enabled: !!selectedGameId }
  );

  const approveProofMutation = trpc.games.approvePaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Comprovante aprovado!");
      getPaymentProofsQuery.refetch();
    },
    onError: () => toast.error("Erro ao aprovar comprovante"),
  });

  const rejectProofMutation = trpc.games.rejectPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Comprovante rejeitado!");
      getPaymentProofsQuery.refetch();
    },
    onError: () => toast.error("Erro ao rejeitar comprovante"),
  });

  const handleSetPixKey = () => {
    if (!pixKey || !selectedGameId) {
      toast.error("Preencha a chave PIX e selecione um jogo");
      return;
    }
    setPixKeyMutation.mutate({ gameId: selectedGameId, pixKey });
  };

  if (gamesLoading) return <div className="animate-pulse h-64 bg-military-surface rounded-lg" />;

  return (
    <div className="space-y-6">
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-green-neon tracking-wider">Gerenciar PIX dos Jogos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-display tracking-wider text-foreground">Selecione um Jogo</Label>
            <select
              value={selectedGameId || ""}
              onChange={(e) => setSelectedGameId(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 bg-military-bg border border-military-border rounded-md text-foreground text-sm"
            >
              <option value="">-- Selecione um jogo --</option>
              {games?.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} - {new Date(game.gameDate).toLocaleDateString("pt-BR")}
                </option>
              ))}
            </select>
          </div>

          {selectedGameId && (
            <>
              <div className="p-4 bg-green-neon/5 border border-green-neon/20 rounded-lg">
                <p className="text-sm font-display text-green-neon tracking-wider mb-2">Chave PIX Atual</p>
                {getPixKeyQuery.data?.pixKey ? (
                  <p className="text-sm text-foreground font-mono break-all">{getPixKeyQuery.data.pixKey}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma chave PIX cadastrada</p>
                )}
              </div>

              {!showPixForm ? (
                <Button
                  onClick={() => setShowPixForm(true)}
                  className="w-full bg-green-neon text-military-bg font-display tracking-wider"
                >
                  {getPixKeyQuery.data?.pixKey ? "Alterar Chave PIX" : "Cadastrar Chave PIX"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-display tracking-wider text-foreground">Nova Chave PIX</Label>
                    <Input
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CPF, Email, Telefone ou Chave Aleatória"
                      className="bg-military-bg border-military-border text-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSetPixKey}
                      disabled={setPixKeyMutation.isPending}
                      className="flex-1 bg-green-neon text-military-bg font-display tracking-wider"
                    >
                      Salvar PIX
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPixForm(false);
                        setPixKey("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedGameId && (
        <Card className="bg-military-surface border-military-border">
          <CardHeader>
            <CardTitle className="font-display text-green-neon tracking-wider">Comprovantes de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {getPaymentProofsQuery.isLoading ? (
              <div className="animate-pulse h-32 bg-military-bg rounded-lg" />
            ) : getPaymentProofsQuery.data && getPaymentProofsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {getPaymentProofsQuery.data.map((proof) => (
                  <div key={proof.id} className="p-4 border border-military-border rounded-lg hover:border-green-neon/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-display text-sm text-green-neon tracking-wider">{proof.userName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(proof.createdAt).toLocaleDateString("pt-BR")} às {new Date(proof.createdAt).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        variant={proof.status === "pending" ? "default" : proof.status === "approved" ? "secondary" : "destructive"}
                        className={proof.status === "pending" ? "bg-yellow-600" : proof.status === "approved" ? "bg-green-600" : "bg-red-600"}
                      >
                        {proof.status === "pending" ? "PENDENTE" : proof.status === "approved" ? "APROVADO" : "REJEITADO"}
                      </Badge>
                    </div>
                    {proof.proofUrl && (
                      <a
                        href={proof.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-neon hover:text-green-glow underline block mb-2"
                      >
                        Ver Comprovante
                      </a>
                    )}
                    {proof.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => approveProofMutation.mutate({ participationId: proof.id })}
                          disabled={approveProofMutation.isPending}
                          className="flex-1 bg-green-600 text-white text-xs hover:bg-green-700"
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectProofMutation.mutate({ participationId: proof.id })}
                          disabled={rejectProofMutation.isPending}
                          className="flex-1 text-xs"
                        >
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProofMutation.mutate({ proofId: proof.id })}
                          disabled={deleteProofMutation.isPending}
                          className="flex-1 text-xs"
                          title="Remover comprovante órfão"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                    {proof.status !== "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProofMutation.mutate({ proofId: proof.id })}
                          disabled={deleteProofMutation.isPending}
                          className="w-full text-xs"
                          title="Remover comprovante"
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-green-dim/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum comprovante enviado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
