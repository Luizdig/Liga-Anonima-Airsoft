import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, DollarSign, Users, Upload, Check, AlertCircle, Copy, Loader2, ArrowLeft, X, Clock, Shield } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";

function PaymentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return <Check className="w-4 h-4 text-green-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "rejected":
      return <X className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-red-400" />;
  }
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    approved: { label: "PAGO", className: "bg-green-600/20 text-green-400 border-green-500/30" },
    pending: { label: "AGUARDANDO", className: "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" },
    rejected: { label: "REJEITADO", className: "bg-red-600/20 text-red-400 border-red-500/30" },
    none: { label: "NÃO PAGO", className: "bg-red-600/20 text-red-300 border-red-500/30" },
  };
  const c = config[status] || config.none;
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

export default function GameDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/jogos/:id");
  const gameId = params?.id ? parseInt(params.id) : null;

  const { data: game, refetch: refetchGame } = trpc.games.byId.useQuery(
    { id: gameId || 0 },
    { enabled: !!gameId }
  );

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<"BDU" | "PMC" | null>(null);
  const proofFileRef = useRef<HTMLInputElement>(null);

  const userIsJoined = trpc.games.isUserJoined.useQuery(
    { gameId: gameId || 0 },
    { enabled: !!gameId && !!user }
  );

  const { data: pixInfo } = trpc.games.getPixKey.useQuery(
    { gameId: gameId || 0 },
    { enabled: !!gameId }
  );

  const { data: teams, refetch: refetchTeams } = trpc.games.getTeamAssignments.useQuery(
    { gameId: gameId || 0 },
    { enabled: !!gameId }
  );

  const { data: participants, refetch: refetchParticipants } = trpc.games.getParticipants.useQuery(
    { gameId: gameId || 0 },
    { enabled: !!gameId }
  );

  const joinGameMutation = trpc.games.joinGame.useMutation({
    onSuccess: () => {
      toast.success("Inscrito com sucesso!");
      userIsJoined.refetch();
      refetchGame();
      refetchParticipants();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao se inscrever");
    },
  });

  const joinWithTeamMutation = trpc.games.joinWithTeam.useMutation({
    onSuccess: () => {
      toast.success("Inscrito com sucesso!");
      userIsJoined.refetch();
      refetchGame();
      refetchTeams();
      refetchParticipants();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao se inscrever");
    },
  });

  const uploadFileMutation = trpc.media.uploadDirect.useMutation({
    onSuccess: (data) => {
      if (gameId && data?.mediaUrl) {
        submitPaymentProofMutation.mutate({ gameId, proofUrl: data.mediaUrl });
      } else {
        toast.error("Erro ao processar upload");
        setUploadingProof(false);
      }
    },
    onError: () => {
      toast.error("Erro ao fazer upload do comprovante");
      setUploadingProof(false);
    },
  });

  const submitPaymentProofMutation = trpc.games.submitPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Comprovante enviado! Aguarde aprovação do ADM.");
      setShowPaymentForm(false);
      setUploadingProof(false);
      refetchParticipants();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar comprovante");
      setUploadingProof(false);
    },
  });

  // Admin mutations
  const approvePaymentMutation = trpc.games.approvePaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Pagamento aprovado!");
      refetchParticipants();
    },
    onError: (error) => toast.error(error.message || "Erro ao aprovar"),
  });

  const rejectPaymentMutation = trpc.games.rejectPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Pagamento rejeitado e jogador banido deste jogo.");
      refetchParticipants();
      refetchGame();
    },
    onError: (error) => toast.error(error.message || "Erro ao rejeitar"),
  });

  const handleJoin = () => {
    if (!user || !gameId) return;
    if (game?.teamsEnabled) {
      if (!selectedTeam) {
        toast.error("Selecione um time para se inscrever");
        return;
      }
      joinWithTeamMutation.mutate({ gameId, team: selectedTeam });
    } else {
      joinGameMutation.mutate({ gameId });
    }
  };

  const handleProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 10MB)");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast.error("Formato não permitido. Use JPG, PNG, WebP ou PDF");
      return;
    }

    setUploadingProof(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) {
        setUploadingProof(false);
        return;
      }
      uploadFileMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  if (!game) {
    return (
      <div className="container px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg">Jogo não encontrado.</p>
        <Link href="/jogos">
          <Button variant="ghost" className="mt-4 text-green-neon">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Jogos
          </Button>
        </Link>
      </div>
    );
  }

  const maxPerTeam = Math.floor((game.maxPlayers || 30) / 2);
  const bduCount = teams?.BDU?.length || 0;
  const pmcCount = teams?.PMC?.length || 0;
  const isAdmin = user?.role === "admin";

  // Find current user's participation
  const myParticipation = participants?.find((p: any) => p.userId === user?.id);

  return (
    <div className="container px-4 py-8 max-w-3xl">
      <Link href="/jogos">
        <Button variant="ghost" className="mb-4 text-green-neon">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Jogos
        </Button>
      </Link>

      <Card className="bg-military-surface border-military-border mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-2xl text-green-neon tracking-wider">
              {game.title}
            </CardTitle>
            <Badge className="bg-green-neon/20 text-green-neon border-green-neon/30">
              {game.status?.toUpperCase() || "AGENDADO"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IMAGEM DO JOGO */}
          {game.imageUrl && (
            <div className="w-full rounded-lg overflow-hidden border border-military-border">
              <img
                src={game.imageUrl}
                alt={game.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* INFORMAÇÕES DO JOGO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-neon" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm font-display text-foreground">
                  {new Date(game.gameDate).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-neon" />
              <div>
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="text-sm font-display text-foreground">{game.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-neon" />
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-sm font-display text-foreground">
                  {game.value ? `R$ ${game.value}` : "Gratuito"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-neon" />
              <div>
                <p className="text-xs text-muted-foreground">Vagas</p>
                <p className="text-sm font-display text-foreground">
                  {game.currentPlayers || 0} / {game.maxPlayers || 30}
                </p>
              </div>
            </div>
          </div>

          {/* PRAZO DE PAGAMENTO */}
          {game.value && (game as any).paymentDeadlineDays && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-bold text-yellow-400">Prazo para pagamento:</span>{" "}
                {(game as any).paymentDeadlineDays} dias após a inscrição. Quem não enviar o comprovante dentro do prazo será removido automaticamente.
              </p>
            </div>
          )}

          {/* DESCRIÇÃO */}
          {game.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Descrição</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{game.description}</p>
            </div>
          )}

          {/* CHAVE PIX */}
          {pixInfo?.pixKey && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 font-display tracking-wider">CHAVE PIX PARA PAGAMENTO</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-foreground flex-1 break-all">{pixInfo.pixKey}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(pixInfo.pixKey);
                    toast.success("Chave PIX copiada!");
                  }}
                  className="text-purple-400 hover:bg-purple-500/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {game.value && (
                <p className="text-xs text-muted-foreground mt-2">Valor: R$ {game.value}</p>
              )}
            </div>
          )}

          {/* TIMES BDU/PMC */}
          {game.teamsEnabled && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-display tracking-wider">TIMES</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                  <p className="font-display text-blue-400 text-sm tracking-wider">TIME BDU</p>
                  <p className="text-xs text-muted-foreground mb-2">{bduCount}/{maxPerTeam} jogadores</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {teams?.BDU && teams.BDU.length > 0 ? (
                      teams.BDU.map((player: any) => (
                        <p key={player.id} className="text-xs text-blue-300">
                          • {player.userName}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhum jogador</p>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                  <p className="font-display text-red-400 text-sm tracking-wider">TIME PMC</p>
                  <p className="text-xs text-muted-foreground mb-2">{pmcCount}/{maxPerTeam} jogadores</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {teams?.PMC && teams.PMC.length > 0 ? (
                      teams.PMC.map((player: any) => (
                        <p key={player.id} className="text-xs text-red-300">
                          • {player.userName}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhum jogador</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INSCRIÇÃO */}
          {user && (
            <div className="space-y-4 pt-4 border-t border-military-border">
              {!userIsJoined.data ? (
                <div className="space-y-4">
                  {/* Seleção de time se habilitado */}
                  {game.teamsEnabled && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-display tracking-wider">ESCOLHA SEU TIME:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setSelectedTeam("BDU")}
                          disabled={bduCount >= maxPerTeam}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedTeam === "BDU"
                              ? "border-blue-500 bg-blue-500/20"
                              : bduCount >= maxPerTeam
                              ? "border-gray-700 opacity-50 cursor-not-allowed"
                              : "border-gray-700 hover:border-blue-500/50"
                          }`}
                        >
                          <p className="font-display text-blue-400 tracking-wider">BDU</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {bduCount >= maxPerTeam ? "TIME CHEIO" : `${bduCount}/${maxPerTeam} vagas`}
                          </p>
                        </button>
                        <button
                          onClick={() => setSelectedTeam("PMC")}
                          disabled={pmcCount >= maxPerTeam}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedTeam === "PMC"
                              ? "border-red-500 bg-red-500/20"
                              : pmcCount >= maxPerTeam
                              ? "border-gray-700 opacity-50 cursor-not-allowed"
                              : "border-gray-700 hover:border-red-500/50"
                          }`}
                        >
                          <p className="font-display text-red-400 tracking-wider">PMC</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pmcCount >= maxPerTeam ? "TIME CHEIO" : `${pmcCount}/${maxPerTeam} vagas`}
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleJoin}
                    disabled={joinGameMutation.isPending || joinWithTeamMutation.isPending || (game.teamsEnabled === true && !selectedTeam)}
                    className="w-full bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow text-lg py-6"
                  >
                    {joinGameMutation.isPending || joinWithTeamMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Inscrevendo...
                      </>
                    ) : (
                      "INSCREVER-SE"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-neon/10 border border-green-neon/30 rounded-lg">
                    <Check className="w-5 h-5 text-green-neon" />
                    <span className="text-sm font-display text-green-neon tracking-wider">
                      VOCÊ ESTÁ INSCRITO
                    </span>
                    {myParticipation && (
                      <PaymentStatusBadge status={myParticipation.paymentStatus} />
                    )}
                  </div>

                  {/* Mostrar status do pagamento para o usuário */}
                  {myParticipation?.paymentStatus === "approved" && (
                    <div className="flex items-center gap-2 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-400">Pagamento confirmado pelo ADM!</span>
                    </div>
                  )}

                  {myParticipation?.paymentStatus === "pending" && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-yellow-400">Comprovante enviado. Aguardando aprovação do ADM.</span>
                    </div>
                  )}

                  {myParticipation?.paymentStatus === "rejected" && (
                    <div className="flex items-center gap-2 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-400">Comprovante rejeitado pelo ADM.</span>
                    </div>
                  )}

                  {/* ENVIO DE COMPROVANTE PIX - só mostra se não aprovado */}
                  {game.value && pixInfo?.pixKey && myParticipation?.paymentStatus !== "approved" && myParticipation?.paymentStatus !== "pending" && (
                    <>
                      {!showPaymentForm ? (
                        <Button
                          onClick={() => setShowPaymentForm(true)}
                          variant="outline"
                          className="w-full border-green-neon/30 text-green-neon font-display tracking-wider"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          ENVIAR COMPROVANTE DE PAGAMENTO
                        </Button>
                      ) : (
                        <Card className="bg-military-bg border-green-neon/30">
                          <CardHeader>
                            <CardTitle className="font-display text-sm text-green-neon tracking-wider">
                              Enviar Comprovante PIX
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-2">
                              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-foreground">
                                Envie uma foto ou PDF do comprovante de pagamento PIX. O ADM do jogo irá validar e confirmar seu pagamento.
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs font-display tracking-wider text-foreground">
                                COMPROVANTE (JPG, PNG, WebP ou PDF - Máx 10MB)
                              </Label>
                              <button
                                onClick={() => proofFileRef.current?.click()}
                                disabled={uploadingProof}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-green-neon/30 rounded-lg hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50 mt-2"
                              >
                                {uploadingProof ? (
                                  <>
                                    <Loader2 className="w-5 h-5 text-green-neon animate-spin" />
                                    <span className="text-sm text-foreground">Enviando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 text-green-neon/50" />
                                    <span className="text-sm text-foreground">Clique para selecionar arquivo</span>
                                  </>
                                )}
                              </button>
                              <input
                                ref={proofFileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="hidden"
                                onChange={handleProofChange}
                              />
                            </div>

                            <Button
                              variant="outline"
                              onClick={() => setShowPaymentForm(false)}
                              className="w-full"
                            >
                              Cancelar
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LISTA DE INSCRITOS */}
      <Card className="bg-military-surface border-military-border">
        <CardHeader>
          <CardTitle className="font-display text-lg text-green-neon tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5" />
            INSCRITOS ({participants?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!participants || participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum jogador inscrito ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((p: any) => (
                <div
                  key={p.participationId}
                  className="flex items-center justify-between p-3 rounded-lg border border-military-border hover:border-green-neon/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PaymentStatusIcon status={p.paymentStatus} />
                    <div>
                      <p className="text-sm font-display text-foreground tracking-wider">
                        {p.userName || "Jogador"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Inscrito em {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentStatusBadge status={p.paymentStatus} />
                    
                    {/* Botões de admin para aprovar/rejeitar */}
                    {isAdmin && p.paymentStatus === "pending" && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          onClick={() => approvePaymentMutation.mutate({ participationId: p.participationId })}
                          disabled={approvePaymentMutation.isPending}
                          className="h-7 px-2 bg-green-600 text-white text-[10px] hover:bg-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Rejeitar comprovante de ${p.userName}? O jogador será BANIDO deste jogo.`)) {
                              rejectPaymentMutation.mutate({ participationId: p.participationId });
                            }
                          }}
                          disabled={rejectPaymentMutation.isPending}
                          className="h-7 px-2 text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Link para ver comprovante (admin) */}
                    {isAdmin && p.proofUrl && (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-green-neon hover:text-green-glow underline ml-1"
                      >
                        Ver
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legenda */}
          <div className="mt-4 pt-4 border-t border-military-border">
            <p className="text-[10px] text-muted-foreground font-display tracking-wider mb-2">LEGENDA:</p>
            <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-400" /> Não pagou</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" /> Aguardando</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Pago</span>
              <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-500" /> Rejeitado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
