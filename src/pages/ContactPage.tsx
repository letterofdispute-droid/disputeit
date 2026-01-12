import Layout from '@/components/layout/Layout';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageSquare, Clock } from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get a response within 24 hours',
    contact: 'support@disputeletters.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available Monday-Friday, 9am-5pm EST',
    contact: 'Start a chat',
  },
  {
    icon: Clock,
    title: 'Response Time',
    description: 'We aim to respond to all inquiries',
    contact: 'Within 24 hours',
  },
];

const ContactPage = () => {
  return (
    <Layout>
      <SEOHead 
        title="Contact Us | DisputeLetters"
        description="Get in touch with the DisputeLetters team. We're here to help with your questions and support needs."
      />

      {/* Hero */}
      <section className="bg-primary py-12 md:py-16">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Have a question or need help? We're here for you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-background">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="inline-flex p-3 bg-primary/10 rounded-xl mx-auto mb-2">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">{method.contact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container-wide">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more about your question or issue..."
                    rows={5}
                  />
                </div>
                <Button type="submit" variant="accent" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
