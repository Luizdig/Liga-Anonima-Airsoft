import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, Plus, Upload, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Feed() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: posts, isLoading, refetch } = trpc.feed.get.useQuery();
  const utils = trpc.useUtils();

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingFeedImg, setUploadingFeedImg] = useState(false);
  const feedFileRef = useRef<HTMLInputElement>(null);

  const uploadFeedImageMutation = trpc.media.uploadDirect.useMutation({
    onSuccess: (data) => {
      if (data?.mediaUrl) {
        setUploadedImages(prev => [...prev, data.mediaUrl]);
        toast.success("Imagem enviada!");
      }
      setUploadingFeedImg(false);
    },
    onError: () => {
      toast.error("Erro ao enviar imagem");
      setUploadingFeedImg(false);
    },
  });

  const handleFeedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Foto muito grande (max 10MB)"); return; }
    setUploadingFeedImg(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) { setUploadingFeedImg(false); return; }
      uploadFeedImageMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = trpc.feed.create.useMutation({
    onSuccess: () => {
      toast.success("Publicação criada!");
      setShowCreate(false);
      setFormData({ title: "", content: "" });
      setUploadedImages([]);
      utils.feed.get.invalidate();
    },
    onError: (e) => toast.error(e.message || "Erro ao criar"),
  });

  const deleteMutation = trpc.feed.delete.useMutation({
    onSuccess: () => {
      toast.success("Publicação removida!");
      refetch();
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleSubmit = () => {
    if (!formData.content.trim()) {
      toast.error("Escreva algum conteúdo");
      return;
    }

    const mediaType: "none" | "image" | "video" | "mixed" = uploadedImages.length > 0 ? "image" : "none";

    createMutation.mutate({
      title: formData.title || undefined,
      content: formData.content,
      mediaUrls: uploadedImages.length > 0 ? uploadedImages : undefined,
      mediaType,
    });
  };

  return (
    <div className="container px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
            FEED DE ATUALIZAÇÕES
          </h1>
          <p className="text-muted-foreground mt-1">
            Notícias e atualizações da Liga Anônima de Airsoft
          </p>
        </div>
      </div>

      {/* Create Post Form */}
      {isAdmin && (
        <Card className="bg-military-surface border-military-border mb-8 glow-border">
          <CardHeader>
            <Button
              onClick={() => setShowCreate(!showCreate)}
              className="w-full bg-green-neon/10 border-green-neon/30 text-green-neon font-display tracking-wider"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showCreate ? "FECHAR" : "NOVA PUBLICAÇÃO"}
            </Button>
          </CardHeader>
          {showCreate && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">TÍTULO (OPCIONAL)</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da publicação"
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider">CONTEÚDO</Label>
                <Textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escreva sua publicação..."
                  rows={4}
                  className="bg-military-bg border-military-border text-foreground"
                />
              </div>
              {/* Upload de imagens */}
              <div>
                <Label className="text-foreground font-display text-xs tracking-wider mb-2 block">FOTOS (OPCIONAL)</Label>
                {/* Preview de imagens já enviadas */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-military-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => feedFileRef.current?.click()}
                  disabled={uploadingFeedImg}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-green-neon/30 rounded-lg hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {uploadingFeedImg ? (
                    <Loader2 className="w-5 h-5 text-green-neon animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-green-neon/50" />
                  )}
                  <span className="text-sm text-foreground">
                    {uploadingFeedImg ? "Enviando..." : "Adicionar foto"}
                  </span>
                </button>
                <input ref={feedFileRef} type="file" accept="image/*" className="hidden" onChange={handleFeedImageChange} />
                <p className="text-xs text-muted-foreground mt-2">Formatos: JPG, PNG, WebP. Máx 10MB por imagem.</p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || uploadingFeedImg}
                className="bg-green-neon text-military-bg font-display tracking-wider"
              >
                PUBLICAR
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-military-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="bg-military-surface border-military-border glow-border-hover transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-neon/10 border border-green-neon/20 flex items-center justify-center">
                      <span className="text-green-neon font-display text-sm font-bold">
                        {(post.authorName || "L.A.A.").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground font-display tracking-wider">
                        {post.authorName || "L.A.A."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate({ id: post.id })}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {post.title && (
                  <h3 className="font-display text-lg text-green-neon tracking-wider mb-2 text-glow-subtle">
                    {post.title}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {post.mediaUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-military-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {post.mediaType === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="w-12 h-12 text-green-neon" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-military-surface border-military-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">O feed está vazio.</p>
            <p className="text-sm text-muted-foreground mt-2">Aguarde atualizações dos administradores.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
