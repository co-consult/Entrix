"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface EventOption {
  id: string;
  name: string;
  venueName?: string;
  scheduledStart?: string;
  scheduled_start?: string;
}

interface EventComboboxProps {
  events: EventOption[];
  value: string;
  onChange: (eventId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function formatEventDate(ev: EventOption) {
  const raw = ev.scheduledStart || ev.scheduled_start;
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function EventCombobox({
  events,
  value,
  onChange,
  disabled,
  placeholder = "Rechercher un événement…",
  className,
}: EventComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = events.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selected ? (
            <span className="truncate text-left">
              {selected.name}
              {selected.venueName ? (
                <span className="text-muted-foreground ml-1">· {selected.venueName}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tapez pour filtrer…" />
          <CommandList>
            <CommandEmpty>Aucun événement trouvé.</CommandEmpty>
            <CommandGroup>
              {events.map((ev) => {
                const dateStr = formatEventDate(ev);
                const searchValue = `${ev.name} ${ev.venueName || ""} ${dateStr}`;
                return (
                  <CommandItem
                    key={ev.id}
                    value={searchValue}
                    onSelect={() => {
                      onChange(ev.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === ev.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium">{ev.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        {ev.venueName && <span>{ev.venueName}</span>}
                        {dateStr && (
                          <>
                            {ev.venueName && <span>·</span>}
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{dateStr}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
