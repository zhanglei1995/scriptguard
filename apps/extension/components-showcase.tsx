import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ToastProvider, Toaster, useToast } from '@/components/ui/toast'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ThemeProvider, ThemeToggle } from '@/components/ui/theme-provider'

function ComponentsShowcaseInner() {
  const [switchOn, setSwitchOn] = useState(false)
  const { addToast } = useToast()

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ScriptGuard Component Showcase</h1>
        <ThemeToggle />
      </div>

      {/* Button */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Button</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Badge */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="muted">Muted</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Card */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Input & Textarea */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Input & Textarea</h2>
        <div className="space-y-2">
          <Input placeholder="Type something..." />
          <Input placeholder="Disabled input" disabled />
          <Textarea placeholder="Write a note..." />
        </div>
      </section>

      {/* Select */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Select</h2>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Switch */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Switch</h2>
        <div className="flex items-center gap-2">
          <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
          <span className="text-sm">{switchOn ? 'On' : 'Off'}</span>
        </div>
      </section>

      {/* Tabs */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Tabs</h2>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content for Tab 1</TabsContent>
          <TabsContent value="tab2">Content for Tab 2</TabsContent>
          <TabsContent value="tab3">Content for Tab 3</TabsContent>
        </Tabs>
      </section>

      {/* Table */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>userscript.user.js</TableCell>
              <TableCell><Badge variant="success">Healthy</Badge></TableCell>
              <TableCell>1.2.0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>adblock.user.js</TableCell>
              <TableCell><Badge variant="destructive">Failed</Badge></TableCell>
              <TableCell>2.0.1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Skeleton */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Skeleton</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>Are you sure you want to proceed?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Tooltip */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Tooltip</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tooltip content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      {/* Toast */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Toast</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => addToast({ title: 'Success', description: 'Operation completed.', variant: 'success' })}>Success Toast</Button>
          <Button onClick={() => addToast({ title: 'Warning', description: 'Something to note.', variant: 'warning' })}>Warning Toast</Button>
          <Button onClick={() => addToast({ title: 'Error', description: 'Something went wrong.', variant: 'error' })}>Error Toast</Button>
          <Button onClick={() => addToast({ title: 'Info', description: 'FYI.', variant: 'info' })}>Info Toast</Button>
        </div>
      </section>

      {/* Empty */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Empty</h2>
        <Card>
          <Empty
            title="No scripts found"
            description="Install some userscripts to get started."
            action={{ label: 'Browse Scripts', onClick: () => {} }}
          />
        </Card>
      </section>

      {/* Command */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Command</h2>
        <Command className="rounded-lg border shadow-md max-w-md">
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Scripts">
              <CommandItem>userscript.user.js</CommandItem>
              <CommandItem>adblock.user.js</CommandItem>
              <CommandItem>darkreader.user.js</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </section>

      <Toaster />
    </div>
  )
}

export default function ComponentsShowcase() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ComponentsShowcaseInner />
      </ToastProvider>
    </ThemeProvider>
  )
}
