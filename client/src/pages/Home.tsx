import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MapPin, DollarSign, Calendar, Users, ArrowRight, Play, Image, Tag, ShoppingBag } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = trpc.feed.get.useQuery();
  const { data: upcomingGames, isLoading: gamesLoading } = trpc.games.upcoming.useQuery();
  const { data: storeItems, isLoading: storeLoading } = trpc.store.list.useQuery();
  const { data: galleryMedia, isLoading: galleryLoading } = trpc.media.approved.useQuery();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/manus-storage/field-bg_850a6238.jpeg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-military-bg/80 via-military-bg/60 to-military-bg" />
        <div className="relative z-10 text-center px-4">
          <img
            src="/manus-storage/logo_6be0edc5.png"
            alt="L.A.A. Logo"
            className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-6 rounded-full border-4 border-green-neon/50 glow-border"
          />
          <h1 className="font-display text-4xl md:text-6xl font-black text-green-neon tracking-widest text-glow mb-4">
            L.A.A.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-2 font-display tracking-wider">
            LIGA ANÔNIMA DE AIRSOFT
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
            A comunidade de airsoft mais feroz da região. Junte-se a nós, jogue,
            negocie e faça parte da liga.
          </p>
          {!isAuthenticated && !authLoading && (
            <Link href={getLoginUrl()}>
              <Button
                size="lg"
                className="bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow text-base px-8"
              >
                FAÇA PARTE DA LIGA
              </Button>
            </Link>
          )}
          {isAuthenticated && !authLoading && (
            <Link href="/jogos">
              <Button
                size="lg"
                className="bg-green-neon text-military-bg font-display tracking-wider hover:bg-green-glow text-base px-8"
              >
                VER PRÓXIMOS JOGOS
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Upcoming Games Section */}
      <section className="container px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-green-neon tracking-wider">
            PRÓXIMOS JOGOS
          </h2>
          <Link href="/jogos">
            <Button variant="ghost" size="sm" className="text-green-neon hover:text-green-glow gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {gamesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-military-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingGames && upcomingGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.slice(0, 6).map((game) => (
              <Link key={game.id} href={`/jogos/${game.id}`}>
                <Card className="bg-military-surface border-military-border glow-border-hover transition-all hover:border-green-neon/50 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-display text-sm text-green-neon tracking-wider truncate">
                        {game.title}
                      </CardTitle>
                      <Badge variant="outline" className="border-green-dim text-green-neon text-xs">
                        AGENDADO
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-dim" />
                      <span>{new Date(game.gameDate).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-dim" />
                      <span className="truncate">{game.location}</span>
                    </div>
                    {game.value && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-dim" />
                        <span>R$ {game.value}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-dim" />
                      <span>{game.currentPlayers} / {game.maxPlayers} jogadores</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-green-neon text-xs font-display tracking-wider border border-green-neon/30 px-2 py-1 rounded">
                        CLIQUE PARA INSCREVER-SE →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-military-surface border-military-border">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Nenhum jogo agendado no momento.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Store Section - Recent Items */}
      <section className="container px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-green-neon tracking-wider">
            LOJA VIRTUAL
          </h2>
          <Link href="/loja">
            <Button variant="ghost" size="sm" className="text-green-neon hover:text-green-glow gap-1">
              Ver loja <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {storeLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-military-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : storeItems && (storeItems as any[]).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(storeItems as any[]).slice(0, 4).map((item) => (
              <Link key={item.id} href={`/loja/${item.id}`}>
                <Card className="bg-military-surface border-military-border glow-border-hover transition-all group cursor-pointer hover:border-green-neon/40 h-full">
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
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-display text-xs text-green-neon tracking-wider truncate">
                      {item.title}
                    </h3>
                    <span className="text-sm font-bold text-foreground flex items-center gap-1 mt-1">
                      <DollarSign className="w-3 h-3 text-green-neon" />
                      R$ {item.price}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-military-surface border-military-border">
            <CardContent className="py-8 text-center">
              <ShoppingBag className="w-10 h-10 text-green-dim/30 mx-auto mb-3" />
              <p className="text-muted-foreground">A loja está vazia. Seja o primeiro a anunciar!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Gallery Section - Recent Media */}
      <section className="container px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-green-neon tracking-wider">
            GALERIA RECENTE
          </h2>
          <Link href="/galeria">
            <Button variant="ghost" size="sm" className="text-green-neon hover:text-green-glow gap-1">
              Ver galeria <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {galleryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-military-surface rounded-lg animate-pulse" />
            ))}
          </div>
        ) : galleryMedia && (galleryMedia as any[]).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(galleryMedia as any[]).slice(0, 6).map((item) => (
              <Link key={item.id} href="/galeria">
                <div className="aspect-square relative overflow-hidden rounded-lg border border-military-border group cursor-pointer hover:border-green-neon/40 transition-all">
                  {item.mediaType === "video" ? (
                    <div className="w-full h-full bg-military-surface flex items-center justify-center">
                      <Play className="w-8 h-8 text-green-neon" />
                    </div>
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.description || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {item.mediaType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="w-8 h-8 text-green-neon" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-military-surface border-military-border">
            <CardContent className="py-8 text-center">
              <Image className="w-10 h-10 text-green-dim/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Galeria vazia. Envie fotos e vídeos!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Feed Section */}
      <section className="container px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-green-neon tracking-wider">
            FEED DE ATUALIZAÇÕES
          </h2>
          <Link href="/feed">
            <Button variant="ghost" size="sm" className="text-green-neon hover:text-green-glow gap-1">
              Ver feed completo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {feedLoading ? (
            [1, 2].map(i => (
              <div key={i} className="h-48 bg-military-surface rounded-lg animate-pulse" />
            ))
          ) : feedPosts && feedPosts.length > 0 ? (
            feedPosts.slice(0, 3).map((post) => (
              <Card key={post.id} className="bg-military-surface border-military-border glow-border-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-neon/10 flex items-center justify-center">
                      <span className="text-green-neon font-display text-xs font-bold">
                        {(post.authorName || "L.A.A.").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {post.authorName || "L.A.A."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  {post.title && (
                    <h3 className="font-display text-base text-green-neon tracking-wider mb-2">
                      {post.title}
                    </h3>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {post.content}
                  </p>
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.mediaUrls.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-military-surface border-military-border">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhuma atualização no feed ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
