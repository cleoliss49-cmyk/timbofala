import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Heart, 
  Calendar, 
  Users, 
  Globe, 
  GraduationCap, 
  Briefcase,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    full_name: string;
    gender?: string | null;
    relationship_status?: string | null;
    birth_date?: string | null;
    languages?: string[] | null;
    education?: string | null;
    profession?: string | null;
    show_relationship_status?: boolean;
    show_birth_date?: boolean;
    show_languages?: boolean;
    show_education?: boolean;
    show_profession?: boolean;
  };
}

const relationshipLabels: Record<string, string> = {
  single: 'Solteiro(a)',
  married: 'Casado(a)',
  dating: 'Namorando',
  widowed: 'Viúvo(a)',
  complicated: 'Em relacionamento complicado',
  prefer_not_to_say: 'Prefiro não informar',
};

const genderLabels: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  non_binary: 'Não-binário',
  other: 'Outro',
  prefer_not_to_say: 'Prefiro não informar',
};

export function ProfileDetailsDialog({
  open,
  onOpenChange,
  profile,
}: ProfileDetailsDialogProps) {
  const hasAnyDetail = 
    (profile.show_relationship_status !== false && profile.relationship_status) ||
    (profile.show_birth_date !== false && profile.birth_date) ||
    profile.gender ||
    (profile.show_languages !== false && profile.languages?.length) ||
    (profile.show_education !== false && profile.education) ||
    (profile.show_profession !== false && profile.profession);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes de {profile.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!hasAnyDetail ? (
            <p className="text-center text-muted-foreground py-8">
              Este usuário não adicionou detalhes ao perfil.
            </p>
          ) : (
            <>
              {profile.show_relationship_status !== false && profile.relationship_status && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status de relacionamento</p>
                    <p className="font-medium">{relationshipLabels[profile.relationship_status] || profile.relationship_status}</p>
                  </div>
                </div>
              )}

              {profile.show_birth_date !== false && profile.birth_date && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de nascimento</p>
                    <p className="font-medium">
                      {format(new Date(profile.birth_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {profile.gender && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gênero</p>
                    <p className="font-medium">{genderLabels[profile.gender] || profile.gender}</p>
                  </div>
                </div>
              )}

              {profile.show_languages !== false && profile.languages && profile.languages.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Globe className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Idiomas</p>
                    <p className="font-medium">{profile.languages.join(', ')}</p>
                  </div>
                </div>
              )}

              {profile.show_education !== false && profile.education && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Escolaridade / Formação</p>
                    <p className="font-medium">{profile.education}</p>
                  </div>
                </div>
              )}

              {profile.show_profession !== false && profile.profession && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-teal-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Profissão / Ocupação</p>
                    <p className="font-medium">{profile.profession}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
