import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export default function Gallery() {
  const { user, isAuthenticated } = useAuth();
  const { data: approvedMedia, isLoading } = trpc.media.approved.useQuery();
  const utils = trpc.useUtils();

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const uploadMutation = trpc.media.uploadFile.useMutation({
    onSuccess: () => {
      toast.success("Mídia enviada para aprovação!");
      setShowUpload(false);
      setUploadFile(null);
      setUploadDesc("");
      setUploadPreview(null);
    },
    onError: () => toast.error("Erro ao enviar mídia"),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 50MB");
      return;
    }
    setUploadFile(file);
    setUploadType(file.type.startsWith("video") ? "video" : "image");
    if (file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Selecione um arquivo");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMutation.mutate({
        fileName: uploadFile.name,
        fileContent: base64,
        contentType: uploadFile.type,
        mediaType: uploadType,
        description: uploadDesc || undefined,
      });
    };
    reader.readAsDataURL(uploadFile);
  };

  const isAdmin = user?.role === "admin";

  // Admin section for pending media
  const { data: pendingMedia, refetch: refetchPending } = trpc.media.pending.useQuery(undefined, { enabled: isAdmin });
  const approveMutation = trpc.media.approve.useMutation({
    onSuccess: () => {
      toast.success("Mídia aprovada!");
      refetchPending();
      utils.media.approved.invalidate();
    },
  });
  const rejectMutation = trpc.media.reject.useMutation({
    onSuccess: () => {
      toast.success("Mídia rejeitada!");
      refetchPending();
    },
  });

  // Lightbox navigation
  const mediaItems = (approvedMedia as any[]) || [];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, goNext, goPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const currentItem = mediaItems[lightboxIndex];

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
            GALERIA
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fotos e vídeos aprovados pela liga
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            ENVIAR
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {isAuthenticated && showUpload && (
        <Card className="bg-military-surface border-green-neon/30 mb-8 glow-border">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie fotos ou vídeos para a galeria. Todo conteúdo será revisado pelos administradores antes de ser publicado.
            </p>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">ARQUIVO (Máx 50MB)</Label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="w-full bg-military-bg border border-military-border rounded-md px-3 py-2 text-foreground text-sm"
              />
              {uploadPreview && (
                <div className="mt-3">
                  <img src={uploadPreview} alt="Preview" className="max-h-40 rounded-lg border border-military-border" />
                </div>
              )}
              {uploadFile && uploadFile.type.startsWith("video") && (
                <div className="mt-3 p-3 bg-military-bg border border-military-border rounded-lg">
                  <p className="text-sm text-green-neon">Vídeo selecionado: {uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">TIPO DETECTADO</Label>
              <p className="bg-military-bg border border-military-border rounded-md px-3 py-2 text-sm text-green-neon">
                {uploadFile ? (uploadFile.type.startsWith("video") ? "Vídeo" : "Imagem") : "Selecione um arquivo"}
              </p>
            </div>
            <div>
              <Label className="text-foreground font-display text-xs tracking-wider">DESCRIÇÃO (OPCIONAL)</Label>
              <input
                type="text"
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                placeholder="Descrição da foto/vídeo..."
                className="w-full bg-military-bg border border-military-border rounded-md px-3 py-2 text-foreground text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="bg-green-neon text-military-bg font-display tracking-wider">
                ENVIAR PARA APROVAÇÃO
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)} className="border-military-border">
                CANCELAR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: Pending Media */}
      {isAdmin && pendingMedia && pendingMedia.length > 0 && (
        <Card className="bg-military-surface border-yellow-500/30 mb-8">
          <CardContent className="pt-6">
            <h2 className="font-display text-lg text-yellow-500 tracking-wider mb-4">
              PENDENTES DE APROVAÇÃO ({pendingMedia.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingMedia.map((item) => (
                <Card key={item.id} className="bg-military-bg border-yellow-500/20">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    {item.mediaType === "video" ? (
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">
                      Por: {item.authorName || "Membro"}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => approveMutation.mutate({ id: item.id })} className="bg-green-neon text-military-bg text-xs">
                        APROVAR
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate({ id: item.id })} className="text-xs">
                        REJEITAR
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square bg-military-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="aspect-square relative overflow-hidden rounded-lg border border-military-border group cursor-pointer hover:border-green-neon/40 transition-all"
            >
              {item.mediaType === "video" ? (
                <>
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-green-neon/90 flex items-center justify-center">
                      <Play className="w-7 h-7 text-military-bg ml-1" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.description || ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.description && (
                  <p className="text-xs text-white/90 truncate">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-military-surface border-military-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">Galeria vazia.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Membros podem enviar fotos e vídeos para aprovação dos administradores.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && currentItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-7 h-7 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-7 h-7 text-white" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute top-4 left-4 z-50 text-white/60 text-sm font-display">
            {lightboxIndex + 1} / {mediaItems.length}
          </div>

          {/* Content */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.mediaType === "video" ? (
              <video
                key={currentItem.id}
                src={currentItem.mediaUrl}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
                preload="auto"
              />
            ) : (
              <img
                key={currentItem.id}
                src={currentItem.mediaUrl}
                alt={currentItem.description || ""}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>

          {/* Description */}
          {currentItem.description && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/70 px-4 py-2 rounded-lg max-w-md text-center">
              <p className="text-sm text-white/90">{currentItem.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
