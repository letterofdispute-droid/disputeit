import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  plan: string;
  letters_count: number;
  created_at: string;
  is_admin: boolean;
  role: string | null;
}

interface EmailUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMAIL_TEMPLATES = {
  custom: {
    subject: '',
    body: '',
  },
  welcome: {
    subject: 'Welcome to DisputeLetters!',
    body: `Hi {{name}},

Welcome to DisputeLetters! We're excited to have you on board.

If you have any questions about creating dispute letters or need assistance, feel free to reply to this email.

Best regards,
The DisputeLetters Team`,
  },
  support: {
    subject: 'How can we help?',
    body: `Hi {{name}},

We noticed you recently visited our site and wanted to reach out to see if there's anything we can help you with.

Whether you have questions about our templates or need guidance on your dispute, we're here to assist.

Best regards,
The DisputeLetters Team`,
  },
  refund_confirmation: {
    subject: 'Your Refund Has Been Processed',
    body: `Hi {{name}},

This is to confirm that your refund has been successfully processed. The funds should appear in your account within 5-10 business days.

If you have any questions, please don't hesitate to reach out.

Best regards,
The DisputeLetters Team`,
  },
};

const EmailUserDialog = ({ 
  user, 
  open, 
  onOpenChange 
}: EmailUserDialogProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState<keyof typeof EMAIL_TEMPLATES>('custom');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleTemplateChange = (value: keyof typeof EMAIL_TEMPLATES) => {
    setTemplate(value);
    const templateData = EMAIL_TEMPLATES[value];
    const name = user?.first_name || 'there';
    setSubject(templateData.subject);
    setBody(templateData.body.replace(/{{name}}/g, name));
  };

  const handleSend = async () => {
    if (!user?.email || !subject || !body) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          to: user.email,
          subject,
          body,
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Email sent',
        description: `Email sent to ${user.email}`,
      });

      // Reset form
      setTemplate('custom');
      setSubject('');
      setBody('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error sending email',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>To</Label>
        <Input value={user?.email || ''} disabled className="bg-muted" />
      </div>

      <div className="space-y-2">
        <Label>Template</Label>
        <Select value={template} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Message</SelectItem>
            <SelectItem value="welcome">Welcome Email</SelectItem>
            <SelectItem value="support">Support Outreach</SelectItem>
            <SelectItem value="refund_confirmation">Refund Confirmation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={8}
          className="resize-none"
        />
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex flex-col gap-2 w-full">
      <Button 
        onClick={handleSend} 
        disabled={isSending || !subject || !body}
        className="w-full"
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </>
        )}
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onOpenChange(false)}
        className="w-full"
        disabled={isSending}
      >
        Cancel
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Send Email</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {formContent}
          </div>
          <DrawerFooter>
            {footerContent}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>
        {formContent}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailUserDialog;
