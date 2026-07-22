import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, DollarSign, Tag, Trash2, Edit2, Search, ArrowRight, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "replica", label: "Réplicas" },
  { value: "acessorio", label: "Acessórios" },
  { value: "mascara", label: "Máscaras" },
  { value: "colete", label: "Colete" },
  { value: "luvas", label: "Luvas" },
  { value: "oculos", label: "Óculos" },
  { value: "bb", label: "BBs" },
  { value: "grenada", label: "Granadas" },
  { value: "outros", label: "Outros" },
];

export default function Store() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "outros",
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rawItems, isLoading, refetch } = trpc.store.list.useQuery();
  const utils = trpc.useUtils();
  const items = (rawItems as any[]) || [];

  const uploadMutation = trpc.media.uploadDirect.useMutation({
    onSuccess: (data) => {
      setUploadedImageUrl(data?.mediaUrl || "");
      toast.success("Foto enviada com sucesso!");
      setUploading(false);
    },
    onError: () => {
      toast.error("Erro ao enviar foto");
      setUploading(false);
    },
  });

  const createMutation = trpc.store.create.useMutation({
    onSuccess: () => {
      toast.success("Anúncio criado!");
      setShowCreate(false);
      setFormData({ title: "", description: "", price: "", category: "outros" });
      setUploadedImageUrl("");
      utils.store.list.invalidate();
    },
    onError: () => toast.error("Erro ao criar anúncio"),
  });

  const deleteMutation = trpc.store.delete.useMutation({
    onSuccess: () => {
      toast.success("Anúncio removido!");
      refetch();
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Foto muito grande (max 10MB)");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) { setUploading(false); return; }
      uploadMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.price) {
      toast.error("Preencha título e preço");
      return;
    }
    const images: string[] = [];
    if (uploadedImageUrl) {
      images.push(uploadedImageUrl);
    }
    createMutation.mutate({
      title: formData.title,
      description: formData.description || "",
      price: parseFloat(formData.price),
      category: formData.category as any,
      images,
    });
  };

  const filteredItems = items.filter((item: any) =>
    (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
    ((item.category || "") && (item.category || "").toLowerCase().includes(search.toLowerCase()))
  );

  const isAdmin = user?.role === "admin";

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
            LOJA VIRTUAL
          </h1>
          <p className="text-muted-foreground mt-1">
            Compre e venda equipamentos de airsoft entre membros
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow"
          >
            <Plus className="w-4 h-4 mr-2" />
            ANUNCIAR
          </Button>
        )}
      </div>

      {/* Create Form */}
      {isAuthenticated && showCreate && (
        <Card className="bg-military-surface border-green-neon/30 mb-8 glow-border">
          <CardHeader>
            <CardTitle className="font-display text-green-neon tracking-wider">
              Novo Anúncio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">TÍTULO</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Réplica M4 AEG"
                className="bg-military-bg border-military-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">DESCRIÇÃO</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o equipamento..."
                className="bg-military-bg border-military-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">PREÇO (R$)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">CATEGORIA</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-military-bg border-military-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Photo Upload */}
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider mb-2 block">FOTO DO EQUIPAMENTO</Label>
              <div className="flex items-center gap-4">
                {uploadedImageUrl && (
                  <div className="relative">
                    <img src={uploadedImageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-military-border" />
                    <button
                      onClick={() => setUploadedImageUrl("")}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-neon/30 rounded-lg hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-green-neon border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-5 h-5 text-green-neon/50" />
                  )}
                  <span className="text-sm text-foreground">
                    {uploadedImageUrl ? "Trocar foto" : "Upload de foto"}
                  </span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Formatos: JPG, PNG, WebP. Tamanho máximo: 10MB</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-green-neon text-military-bg font-display tracking-wider">
                PUBLICAR ANÚNCIO
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-military-border">
                CANCELAR
              </Button>
            </div>
            <p className="text-xs text-yellow-500/80 mt-2">
              * Cada venda realizada na plataforma gera uma taxa de 5% para manutenção do site (configurável pelos ADMs).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar equipamentos..."
          className="bg-military-surface border-military-border text-foreground pl-10"
        />
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 bg-military-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/loja/${item.id}`}>
              <Card className="bg-military-surface border-military-border glow-border-hover transition-all group cursor-pointer hover:border-green-neon/40">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-military-bg flex items-center justify-center">
                      <Tag className="w-12 h-12 text-green-dim/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-green-neon text-military-bg font-display text-[10px] tracking-wider">
                    {item.category}
                  </Badge>
                  {item.status === "sold" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg font-display">
                        VENDIDO
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-display text-sm text-green-neon tracking-wider truncate group-hover:text-green-glow transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-neon" />
                      {item.price}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.sellerName}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-military-surface border-military-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              {search ? "Nenhum resultado encontrado." : "A loja está vazia."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Seja o primeiro a anunciar equipamentos de airsoft!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
