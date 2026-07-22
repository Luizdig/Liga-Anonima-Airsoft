import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  User, Shield, Calendar, MapPin, Camera, Plus, Trash2, Edit2,
  Upload, ArrowLeft, Gamepad2, Clock, History
} from "lucide-react";
import { useState, useRef, useMemo } from "react";

export default function Profile() {
  const { user: currentUser } = useAuth();
  const params = useParams<{ userId: string }>();
  const userId = params.userId ? parseInt(params.userId) : (currentUser?.id || 0);
  const [, navigate] = useLocation();
  const isOwnProfile = currentUser?.id === userId;

  // Skip query if no valid userId
  const { data: profileData, isLoading, refetch } = trpc.profile.get.useQuery(
    { userId: Number.isNaN(userId) ? 0 : userId },
    { enabled: !Number.isNaN(userId) && userId > 0 }
  );

  const addLoadoutMutation = trpc.profile.addLoadoutPhoto.useMutation({
    onSuccess: () => { toast.success("Foto adicionada ao loadout!"); refetch(); },
    onError: (err) => { toast.error(err.message || "Erro ao adicionar"); },
  });

  const deleteLoadoutMutation = trpc.profile.deleteLoadoutPhoto.useMutation({
    onSuccess: () => { toast.success("Foto removida"); refetch(); },
  });

  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Perfil atualizado!"); refetch(); },
    onError: () => toast.error("Erro ao atualizar"),
  });

  if (isLoading) return (
    <div className="container px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );

  if (!profileData) return (
    <div className="container px-4 py-20 text-center">
      <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">Perfil não encontrado.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Voltar</Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header Banner */}
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/manus-storage/pasted_file_gU1gjQ_WhatsAppImage2026-07-02at00.01.36.jpeg_8b8a4c0a.jpeg')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-military-bg/80 to-military-bg" />
        <div className="container px-4 relative">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-neon mb-4" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-military-surface border-2 border-green-neon/30 flex items-center justify-center overflow-hidden">
              {profileData.profile?.avatarUrl ? (
                <img src={profileData.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-green-neon/30" />
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-green-neon tracking-wider text-glow-subtle">
                {profileData.user.name || "Membro"}
              </h1>
              {profileData.profile?.nickname && (
                <p className="text-green-neon/70 text-sm mt-1">"{profileData.profile.nickname}"</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className={
                  profileData.user.role === "admin"
                    ? "border-green-neon text-green-neon"
                    : "border-muted-foreground text-muted-foreground"
                }>
                  {profileData.user.role === "admin" ? "ADMINISTRADOR" : "MEMBRO"}
                </Badge>
                {profileData.user.banned && (
                  <Badge variant="outline" className="border-red-500 text-red-500">BANIDO</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bio & Info */}
          <Card className="bg-military-surface border-military-border">
            <CardHeader>
              <CardTitle className="font-display text-green-neon tracking-wider text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData.profile?.bio && (
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground">BIO</Label>
                  <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{profileData.profile.bio}</p>
                </div>
              )}
              {profileData.profile?.nickname && (
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground">APELIDO</Label>
                  <p className="text-sm text-foreground mt-1">{profileData.profile.nickname}</p>
                </div>
              )}
              <div>
                <Label className="text-xs font-display tracking-wider text-muted-foreground">MEMBRO DESDE</Label>
                <p className="text-sm text-foreground mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-neon/50" />
                  {new Date(profileData.user.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {isOwnProfile && (
                <EditProfileDialog
                  user={profileData.user}
                  profile={profileData.profile}
                  onSaved={() => refetch()}
                  updateProfileMutation={updateProfileMutation}
                />
              )}
            </CardContent>
          </Card>

          {/* Loadout Photos */}
          <Card className="bg-military-surface border-military-border">
            <CardHeader>
              <CardTitle className="font-display text-green-neon tracking-wider text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" /> Loadout ({profileData.photos.length}/5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {profileData.photos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img src={photo.photoUrl} alt={photo.caption || "Loadout"} className="w-full h-32 object-cover rounded-lg border border-military-border" />
                    {photo.caption && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{photo.caption}</p>}
                    {isOwnProfile && (
                      <button
                        onClick={() => deleteLoadoutMutation.mutate({ id: photo.id })}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {profileData.photos.length < 5 && isOwnProfile && (
                  <UploadPhotoButton
                    onUploaded={() => refetch()}
                    addLoadoutMutation={addLoadoutMutation}
                  />
                )}
              </div>
              {profileData.photos.length === 0 && !isOwnProfile && (
                <p className="text-center text-muted-foreground text-sm py-4">Sem fotos do loadout.</p>
              )}
            </CardContent>
          </Card>

          {/* Game History */}
          <Card className="bg-military-surface border-military-border">
            <CardHeader>
              <CardTitle className="font-display text-green-neon tracking-wider text-lg flex items-center gap-2">
                <History className="w-5 h-5" /> Histórico de Jogos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileData.participations.length > 0 ? (
                <div className="space-y-3">
                  {profileData.participations.map((p: any) => (
                    <div key={p.id} className="p-3 border border-military-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-neon">{p.gameTitle}</p>
                        {p.paymentStatus === "approved" && (
                          <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-[10px]">PAGO</Badge>
                        )}
                        {p.paymentStatus === "pending" && (
                          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-[10px]">AGUARDANDO</Badge>
                        )}
                        {p.paymentStatus === "rejected" && (
                          <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-[10px]">REJEITADO</Badge>
                        )}
                        {(!p.paymentStatus || p.paymentStatus === "none") && (
                          <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30 text-[10px]">INSCRITO</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.gameDate).toLocaleDateString("pt-BR")}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.gameLocation}</span>
                      </div>
                      {p.paymentStatus === "approved" && (
                        <p className="text-[10px] text-green-400 mt-1">Pagamento confirmado pelo ADM</p>
                      )}
                      {p.paymentStatus === "pending" && (
                        <p className="text-[10px] text-yellow-400 mt-1">Comprovante enviado, aguardando aprovação</p>
                      )}
                      {p.paymentStatus === "rejected" && (
                        <p className="text-[10px] text-red-400 mt-1">Comprovante rejeitado pelo ADM</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-10 h-10 text-green-neon/20 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {isOwnProfile ? "Você ainda não participou de nenhum jogo." : "Este membro ainda não participou de jogos."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ============ UPLOAD PHOTO BUTTON ============ */
function UploadPhotoButton({
  onUploaded,
  addLoadoutMutation,
}: {
  onUploaded: () => void;
  addLoadoutMutation: ReturnType<typeof trpc.profile.addLoadoutPhoto.useMutation>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Foto muito grande (max 10MB)"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) { setUploading(false); return; }
      addLoadoutMutation.mutate({
        fileContent: base64,
        fileName: file.name,
        contentType: file.type,
        caption: "",
      });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <button
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="w-full h-32 border-2 border-dashed border-green-neon/30 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-green-neon/60 hover:bg-green-neon/5 transition-colors disabled:opacity-50"
    >
      {uploading ? (
        <div className="animate-spin w-6 h-6 border-2 border-green-neon border-t-transparent rounded-full" />
      ) : (
        <>
          <Plus className="w-6 h-6 text-green-neon/50" />
          <span className="text-xs text-muted-foreground">Adicionar Foto</span>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </button>
  );
}

/* ============ EDIT PROFILE DIALOG ============ */
function EditProfileDialog({
  user, profile, onSaved, updateProfileMutation,
}: {
  user: { id: number; name: string | null; email: string | null; role: "user" | "admin"; banned: boolean; createdAt: Date };
  profile: { id: number; userId: number; nickname: string | null; bio: string | null; avatarUrl: string | null } | null;
  onSaved: () => void;
  updateProfileMutation: ReturnType<typeof trpc.profile.update.useMutation>;
}) {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadAvatarMutation = trpc.media.uploadDirect.useMutation({
    onSuccess: (data) => {
      setAvatarUrl(data?.mediaUrl || "");
      toast.success("Avatar atualizado!");
    },
    onError: () => toast.error("Erro ao fazer upload do avatar"),
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Foto muito grande (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1];
      if (!base64) return;
      uploadAvatarMutation.mutate({
        fileName: file.name,
        fileContent: base64,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Button variant="outline" size="sm" className="border-green-neon/30 text-green-neon hover:bg-green-neon/10" onClick={() => setOpen(true)}>
        <Edit2 className="w-4 h-4 mr-2" /> Editar Perfil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-military-surface border-military-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-green-neon tracking-wider text-lg">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-display tracking-wider text-foreground">Avatar</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-16 h-16 rounded-full bg-military-bg border border-military-border flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-green-neon/30" />
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-display tracking-wider text-foreground">Apelido</Label>
              <Input value={nickname} onChange={e => setNickname(e.target.value)} className="bg-military-bg border-military-border text-foreground" placeholder="Seu apelido no campo..." />
            </div>
            <div>
              <Label className="text-xs font-display tracking-wider text-foreground">Bio</Label>
              <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-military-bg border border-military-border text-foreground rounded-md p-2 text-sm" placeholder="Fale sobre você, suas especialidades, experiência..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateProfileMutation.mutate({ nickname: nickname || undefined, bio: bio || undefined, avatarUrl: avatarUrl || undefined })} className="bg-green-neon text-military-bg font-display tracking-wider flex-1">Salvar</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
