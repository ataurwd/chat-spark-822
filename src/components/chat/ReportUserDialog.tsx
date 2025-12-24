import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ReportUserDialogProps {
  userName: string;
  onReport: (reason?: string) => Promise<{ error: Error | null }>;
  hasReported: boolean;
}

export const ReportUserDialog = ({ userName, onReport, hasReported }: ReportUserDialogProps) => {
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleReport = async () => {
    const { error } = await onReport(reason);
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to report user',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'User Reported',
        description: `${userName} has been reported.`,
      });
      setReason('');
      setIsOpen(false);
    }
  };

  if (hasReported) {
    return (
      <Button variant="ghost" size="icon" disabled className="text-muted-foreground">
        <AlertTriangle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report {userName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will report the user for inappropriate behavior. If a user receives 3 or more reports, they will be blocked from messaging.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Reason for reporting (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
