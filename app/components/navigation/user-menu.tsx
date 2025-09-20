"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  CreditCard,
  HelpCircle,
  Moon,
  Sun,
  Plus
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/app/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase-browser"
import { toast } from "react-hot-toast"

interface UserMenuProps {
  user?: {
    id?: string
    email?: string
    user_metadata?: {
      role?: string
      business_name?: string
      avatar_url?: string
    }
  } | null
  businessName?: string | null
  className?: string
  align?: "start" | "center" | "end"
}

export function UserMenu({ user, businessName, className, align = "end" }: UserMenuProps) {
  const router = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [workspace, setWorkspace] = React.useState("personal")

  if (!user) return null

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error signing out")
    } else {
      toast.success("Signed out successfully")
      router.push("/login")
    }
  }

  const getInitials = (email: string, businessName?: string | null) => {
    if (businessName) {
      return businessName
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  const displayName = businessName || user.user_metadata?.business_name || user.email?.split("@")[0] || "User"
  const initials = getInitials(user.email || "", businessName)
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors",
            className
          )}
          data-profile-dropdown
        >
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-[var(--color-primary)] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-[var(--color-text-primary)] leading-tight">
              {displayName}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {user.email}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)] ml-1 hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-[280px] bg-white border border-[var(--color-border-subtle)] shadow-lg rounded-lg p-2"
        sideOffset={8}
      >
        {/* Account Info */}
        <div className="px-2 py-2 border-b border-[var(--color-border-subtle)] mb-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{displayName}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{user.email}</p>
        </div>

        {/* Workspace Switcher */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer">
              <Building2 className="h-4 w-4" />
              <span className="flex-1 text-left">Switch workspace</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-[200px]">
              <DropdownMenuRadioGroup value={workspace} onValueChange={setWorkspace}>
                <DropdownMenuRadioItem value="personal" className="flex items-center gap-2">
                  <span>Personal</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="business" className="flex items-center gap-2">
                  <span>{businessName || "Business"}</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create workspace</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href="/merchant/dashboard/profile"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/merchant/settings"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/merchant/wallets"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Theme Switcher */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer">
              {theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="flex-1 text-left">Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                <DropdownMenuRadioItem value="light" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Help & Sign Out */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href="/help"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-[var(--color-bg-subtle)] cursor-pointer text-[var(--color-text-danger)]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}