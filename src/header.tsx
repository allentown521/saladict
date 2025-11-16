import { UserButton } from "@daveyplate/better-auth-ui"

export function Header() {
    return (
        <header className="sticky top-0 z-50 flex h-12 justify-between border-b bg-background/60 px-safe-or-4 backdrop-blur md:h-14 md:px-safe-or-6">
            <div className="flex items-center gap-2">
                <UserButton size="icon" disableDefaultLinks />
            </div>
        </header>
    )
}
