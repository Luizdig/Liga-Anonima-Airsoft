import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useParams, Link } from "wouter";
import { ArrowLeft, DollarSign, MessageCircle, Send, Tag, Truck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function StoreDetail() {
  const params = useParams<{ id: string }>();
  const itemId = parseInt(params.id || "0");
  const { user, isAuthenticated } = useAuth();

  const { data: allItems, isLoading } = trpc.store.list.useQuery();
  const rawItem = (allItems as any[])?.find((i: any) => i.id === itemId) || null;
  // Extend the item with the properties we need
  const item = rawItem ? ({
    ...rawItem,
    status: (rawItem as any).status || "active",
    condition: (rawItem as any).condition || "usado",
    category: (rawItem as any).category || "outros",
    price: (rawItem as any).price || "0",
    title: (rawItem as any).title || "",
    description: (rawItem as any).description || "",
    createdAt: (rawItem as any).createdAt || new Date(),
    sellerId: (rawItem as any).sellerId || 0,
    sellerName: (rawItem as any).sellerName || "Membro",
    images: (rawItem as any).images || [],
    id: (rawItem as any).id || 0,
  } as any) : null;
  const { data: chatMessages, refetch: refetchChat } = trpc.chat.messages.useQuery({ storeItemId: itemId }, { enabled: !!itemId });

  const [message, setMessage] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item && user) {
      setIsSeller(item.sellerId === user.id);
    }
  }, [item, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessageMutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchChat();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao enviar"),
  });

  const buyMutation = trpc.store.buy.useMutation({
    onSuccess: () => toast.success("Solicitação de compra enviada! E-mails foram disparados."),
    onError: (e: any) => toast.error(e.message || "Erro ao solicitar compra"),
  });

  const handleSend = () => {
    if (!message.trim() || !user) return;
    if (!item) return;
    sendMessageMutation.mutate({
      storeItemId: itemId,
      receiverId: item.sellerId,
      message: message,
    });
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="animate-pulse h-96 bg-military-surface rounded-lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container px-4 py-8 text-center">
        <p className="text-muted-foreground">Item não encontrado.</p>
        <Link href="/loja">
          <Button variant="ghost" className="text-green-neon mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a loja
          </Button>
        </Link>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    replica: "Réplicas", acessorio: "Acessórios", mascara: "Máscaras",
    colete: "Colete", luvas: "Luvas", oculos: "Óculos",
    bb: "BBs", grenada: "Granadas", outros: "Outros",
  };

  return (
    <div className="container px-4 py-8">
      <Link href="/loja">
        <Button variant="ghost" className="text-green-neon mb-6 hover:bg-green-neon/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a Loja
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Info */}
        <div className="space-y-6">
          {item.images && item.images.length > 0 ? (
            <div className="aspect-square rounded-lg overflow-hidden border border-military-border">
              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square rounded-lg bg-military-surface border border-military-border flex items-center justify-center">
              <Tag className="w-24 h-24 text-green-dim/20" />
            </div>
          )}

          <div>
            <Badge className="bg-green-neon text-military-bg font-display text-xs tracking-wider mb-3">
              {categoryLabels[item.category] || item.category}
            </Badge>
            <h1 className="font-display text-2xl md:text-3xl text-green-neon tracking-wider text-glow-subtle">
              {item.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-6 sm:w-8 h-6 sm:h-8 text-green-neon" />
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {item.price}
            </span>
          </div>

          {item.description && (
            <Card className="bg-military-surface border-military-border">
              <CardContent className="pt-4">
                <h3 className="font-display text-sm text-green-neon tracking-wider mb-2">DESCRIÇÃO</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-military-surface border-military-border">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vendedor</span>
                <span className="text-foreground font-medium">{item.sellerName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estado</span>
                <span className="text-foreground">{item.condition === "novo" ? "Novo" : item.condition === "usado" ? "Usado" : "Recondicionado"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Publicado</span>
                <span className="text-foreground">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              {item.status === "sold" && (
                <Badge className="w-full justify-center bg-yellow-500 text-military-bg font-display">
                  <Truck className="w-4 h-4 mr-2" />
                  VENDIDO
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat + Buy */}
        <div className="space-y-6">
          {/* Buy Button */}
          {item.status === "active" && !isSeller && isAuthenticated && user?.id !== item.sellerId && (
            <Card className="bg-military-surface border-green-neon/30 glow-border">
              <CardContent className="pt-4">
                <Button
                  onClick={() =>     buyMutation.mutate({ id: itemId })}
                  disabled={buyMutation.isPending}
                  className="w-full bg-green-neon text-military-bg font-display tracking-wider text-base sm:text-lg py-4 sm:py-6 hover:bg-green-glow"
                >
                  COMPRAR AGORA
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Ao clicar, um e-mail será enviado ao vendedor e ao ADM Master.
                  A negociação será feita por fora da plataforma.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          {isAuthenticated && item.status === "active" && (
            <Card className="bg-military-surface border-military-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm text-green-neon tracking-wider flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  CHAT DE NEGOCIAÇÃO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 overflow-y-auto space-y-2 mb-3 border border-military-border rounded-lg p-3 bg-military-bg/50">
                  {chatMessages && chatMessages.length > 0 ? (
                    chatMessages.slice().reverse().map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMine
                              ? "bg-green-neon/20 border border-green-neon/30 text-foreground"
                              : "bg-military-surface border border-military-border text-muted-foreground"
                          }`}>
                            <p className="text-xs font-display text-green-dim mb-1">
                              {isMine ? "Você" : "Outro usuário"}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-8">
                      Sem mensagens ainda. Inicie a conversa!
                    </p>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Escreva sua mensagem..."
                    className="bg-military-bg border-military-border text-foreground"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-green-neon text-military-bg shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isAuthenticated && (
            <Card className="bg-military-surface border-military-border">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Faça login para enviar mensagens e comprar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
