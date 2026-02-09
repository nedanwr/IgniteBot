"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Power } from "lucide-react";
import type { PluginId } from "@ignite-bot/convex/lib/plugins";
import { toast } from "sonner";

import { useGuildPlugins } from "~/hooks/use-guild-plugins";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "~/components/ui/alert-dialog";

type PluginHeaderProps = {
  pluginId: PluginId;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PluginHeader({
  pluginId,
  icon,
  title,
  description,
  children
}: PluginHeaderProps) {
  const params = useParams<{ discordId: string }>();
  const router = useRouter();
  const { disablePlugin } = useGuildPlugins(params.discordId);
  const [showDisable, setShowDisable] = useState(false);

  const handleDisable = async () => {
    try {
      await disablePlugin(pluginId);
      toast.success(`Disabled ${title}`);
      router.push(`/guild/${params.discordId}`);
    } catch {
      toast.error(`Failed to disable ${title}`);
    } finally {
      setShowDisable(false);
    }
  };

  return (
    <>
      <div className="animate-fade-up mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {children}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1.5"
            onClick={() => setShowDisable(true)}
          >
            <Power className="size-4" />
            Disable
          </Button>
        </div>
      </div>

      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the {title} plugin for this server. You can
              re-enable it at any time from the sidebar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDisable}>
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
