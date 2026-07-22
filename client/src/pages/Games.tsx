import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, DollarSign, Calendar, Users, Plus, Trash2, Edit2, Upload, X, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function Games() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const allGamesQuery = trpc.games.all.useQuery();
  const { data: upcomingGames, isLoading: upcomingLoading } = trpc.games.upcoming.useQuery();
  const utils = trpc.useUtils();
  
  const allGames = allGamesQuery.data;
  const allLoading = allGamesQuery.isLoading;
  const refetchAll = allGamesQuery.refetch;
  
  // Use upcoming games for non-admin, all games for admin
  const games = isAdmin && allGames ? allGames : upcomingGames;
  const isLoading = isAdmin ? allLoading : upcomingLoading;
  const refetch = isAdmin ? refetchAll : () => {};

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    gameDate: "",
    value: "",
    maxPlayers: "30",
    pixKey: "",
    teamsEnabled: false,
    paymentDeadlineDays: "3",
  });
  const [uploadedGameImage, setUploadedGameImage] = useState<string>("");
  const [uploadingGameImg, setUploadingGameImg] = useState(false);
  const gameFileRef = useRef<HTMLInputElement>(null);
  const [selectedGameForParticipants, setSelectedGameForParticipants] = useState<number | null>(null);

  const joinGameMutation = trpc.games.joinGame.useMutation({
    onSuccess: () => {
      toast.success("Inscrito com sucesso!");
      utils.games.isUserJoined.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao se inscrever");
    },
  });

  const uploadGameImageMutation = trpc.media.uploadDirect.useMutation({
    onSuccess: (data) => {
      setUploadedGameImage(data.mediaUrl || "");
      toast.success("Foto do jogo enviada!");
      setUploadingGameImg(false);
    },
    onError: () => { toast.error("Erro ao enviar foto"); setUploadingGameImg(false); },
  });

  const handleGameImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Foto muito grande (max 10MB)"); return; }
    setUploadingGameImg(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) { setUploadingGameImg(false); return; }
      uploadGameImageMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const createMutation = trpc.games.create.useMutation({
    onSuccess: () => {
      toast.success("Jogo criado com sucesso!");
      setShowCreate(false);
      setFormData({ title: "", description: "", location: "", gameDate: "", value: "", maxPlayers: "30", pixKey: "", teamsEnabled: false, paymentDeadlineDays: "3" });
      utils.games.all.invalidate();
      utils.games.upcoming.invalidate();
    },
    onError: () => toast.error("Erro ao criar jogo"),
  });

  const updateMutation = trpc.games.update.useMutation({
    onSuccess: () => {
      toast.success("Jogo atualizado!");
      setShowEdit(null);
      setUploadedGameImage("");
      setFormData({ title: "", description: "", location: "", gameDate: "", value: "", maxPlayers: "30", pixKey: "", teamsEnabled: false, paymentDeadlineDays: "3" });
      utils.games.all.invalidate();
      utils.games.upcoming.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const deleteMutation = trpc.games.delete.useMutation({
    onSuccess: () => {
      toast.success("Jogo removido!");
      utils.games.all.invalidate();
      utils.games.upcoming.invalidate();
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.location || !formData.gameDate) {
      toast.error("Preencha título, local e data");
      return;
    }
    const parsedDate = new Date(formData.gameDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2024) {
      toast.error("Data inválida. Selecione uma data válida.");
      return;
    }
    const imageUrl = uploadedGameImage || undefined;
    if (showEdit !== null) {
      updateMutation.mutate({
        id: showEdit,
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location,
        gameDate: new Date(formData.gameDate).toISOString(),
        value: formData.value ? String(parseFloat(formData.value)) : undefined,
        maxPlayers: parseInt(formData.maxPlayers) || 30,
        imageUrl,
        pixKey: formData.pixKey || undefined,
        teamsEnabled: formData.teamsEnabled,
        paymentDeadlineDays: parseInt(formData.paymentDeadlineDays) || 3,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location,
        gameDate: new Date(formData.gameDate).toISOString(),
        value: formData.value ? String(parseFloat(formData.value)) : undefined,
        maxPlayers: parseInt(formData.maxPlayers) || 30,
        imageUrl,
        pixKey: formData.pixKey || undefined,
        teamsEnabled: formData.teamsEnabled,
        paymentDeadlineDays: parseInt(formData.paymentDeadlineDays) || 3,
      });
    }
  };

  const handleEdit = (game: any) => {
    setFormData({
      title: game.title,
      description: game.description || "",
      location: game.location,
      gameDate: new Date(game.gameDate).toISOString().split("T")[0],
      value: game.value || "",
      maxPlayers: String(game.maxPlayers),
      pixKey: "",
      teamsEnabled: game.teamsEnabled ?? false,
      paymentDeadlineDays: String(game.paymentDeadlineDays ?? 3),
    });
    setUploadedGameImage(game.imageUrl || "");
    setShowEdit(game.id);
    setShowCreate(false);
  };

  const handleCancel = () => {
    setShowCreate(false);
    setShowEdit(null);
    setFormData({ title: "", description: "", location: "", gameDate: "", value: "", maxPlayers: "30", pixKey: "", teamsEnabled: false, paymentDeadlineDays: "3" });
    setUploadedGameImage("");
  };

  const upcomingIds = new Set(upcomingGames?.map(g => g.id) || []);

  const handleGameCardClick = (gameId: number) => {
    if (!isAdmin) {
      setSelectedGameForParticipants(gameId);
    }
  };

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
            JOGOS AGENDADOS
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Confira os próximos jogos e fique por dentro da agenda
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setShowCreate(!showCreate); setShowEdit(null); }}
            className="bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            NOVO JOGO
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreate || showEdit !== null) && (
        <Card className="bg-military-surface border-green-neon/30 mb-8 glow-border">
          <CardHeader>
            <CardTitle className="font-display text-green-neon tracking-wider">
              {showEdit !== null ? "Editar Jogo" : "Criar Novo Jogo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">TÍTULO</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome do jogo"
                className="bg-military-bg border-military-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">DESCRIÇÃO</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do jogo..."
                className="bg-military-bg border-military-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">LOCAL</Label>
                <Input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Local do jogo"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">DATA</Label>
                <Input
                  type="date"
                  value={formData.gameDate}
                  onChange={e => setFormData({ ...formData, gameDate: e.target.value })}
                  min="2024-01-01"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">VALOR (R$)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">VAGAS MÁX</Label>
                <Input
                  type="number"
                  value={formData.maxPlayers}
                  onChange={e => setFormData({ ...formData, maxPlayers: e.target.value })}
                  placeholder="30"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
            </div>
            {/* PIX Key */}
            {isAdmin && (
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">CHAVE PIX (OPCIONAL)</Label>
                <Input
                  value={formData.pixKey}
                  onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="Sua chave PIX (CPF, email, telefone ou aleatória)"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
            )}
            {/* Teams BDU/PMC */}
            {isAdmin && (
              <div className="flex items-center gap-3 p-3 bg-military-bg border border-military-border rounded-lg">
                <input
                  type="checkbox"
                  id="teamsEnabled"
                  checked={formData.teamsEnabled}
                  onChange={e => setFormData({ ...formData, teamsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-green-500"
                />
                <Label htmlFor="teamsEnabled" className="text-foreground font-display text-xs tracking-wider cursor-pointer">
                  HABILITAR TIMES (BDU vs PMC) — Limite de 50% das vagas por time
                </Label>
              </div>
            )}
            {/* Prazo de Pagamento */}
            {isAdmin && formData.value && (
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">PRAZO PARA PAGAMENTO (DIAS)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.paymentDeadlineDays}
                  onChange={e => setFormData({ ...formData, paymentDeadlineDays: e.target.value })}
                  className="bg-military-bg border-military-border text-foreground mt-1"
                  placeholder="3"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Jogadores que não enviarem comprovante dentro deste prazo serão removidos automaticamente. Se falharem 2 vezes, serão banidos do jogo.
                </p>
              </div>
            )}
            {/* Game Image Upload */}
            {isAdmin && (
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider mb-2 block">FOTO DO JOGO (OPCIONAL)</Label>
                <div className="flex items-center gap-4">
                  {uploadedGameImage && (
                    <div className="relative">
                      <img src={uploadedGameImage} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-military-border" />
                      <button
                        onClick={() => setUploadedGameImage("")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => gameFileRef.current?.click()}
                    disabled={uploadingGameImg}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-neon/30 rounded-lg hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50"
                  >
                    {uploadingGameImg ? (
                      <div className="animate-spin w-5 h-5 border-2 border-green-neon border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="w-5 h-5 text-green-neon/50" />
                    )}
                    <span className="text-sm text-foreground">
                      {uploadedGameImage ? "Trocar foto" : "Upload de foto"}
                    </span>
                  </button>
                  <input ref={gameFileRef} type="file" accept="image/*" className="hidden" onChange={handleGameImageChange} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Formatos: JPG, PNG, WebP. Tamanho máximo: 10MB</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || uploadingGameImg}
                className="bg-green-neon text-military-bg font-display tracking-wider"
              >
                {showEdit !== null ? "SALVAR" : "CRIAR"}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="border-military-border">
                CANCELAR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Games List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-military-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : games && games.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {games.map((game) => {
            const isUpcoming = upcomingIds.has(game.id);
            return (
              <Link key={game.id} href={`/jogos/${game.id}`}>
                <Card className="bg-military-surface border-military-border glow-border-hover transition-all hover:border-green-neon/30 cursor-pointer h-full">
                  {game.imageUrl && (
                    <div className="w-full h-40 overflow-hidden rounded-t-lg border-b border-military-border">
                      <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-display text-base text-green-neon tracking-wider hover:text-green-glow">
                          {game.title}
                        </CardTitle>
                        {game.createdBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Organizado por ADM L.A.A.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                        <Badge variant={isUpcoming ? "default" : "secondary"} className={isUpcoming ? "bg-green-neon text-military-bg" : "border-green-dim text-green-neon"}>
                          {game.status === "upcoming" ? "AGENDADO" : game.status === "ongoing" ? "EM ANDAMENTO" : game.status === "completed" ? "CONCLUÍDO" : "CANCELADO"}
                        </Badge>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleEdit(game); }} className="text-green-neon hover:bg-green-neon/10">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); deleteMutation.mutate({ id: game.id }); }} className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-dim" />
                        <span>{new Date(game.gameDate).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-dim" />
                        <span>{game.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-dim" />
                        <span>{game.value ? `R$ ${game.value}` : "Gratuito"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-dim" />
                        <span>{game.currentPlayers} / {game.maxPlayers} jogadores</span>
                      </div>
                    </div>
                    {game.description && (
                      <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap line-clamp-2">{game.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="bg-military-surface border-military-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">Nenhum jogo agendado no momento.</p>
            <p className="text-sm text-muted-foreground mt-2">Fique atento às atualizações da liga!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
