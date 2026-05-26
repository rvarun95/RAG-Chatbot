import {
    Show,
    SignInButton,
    SignOutButton,
    SignUpButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";

export const Navigation = () => {
    return (
        <nav className="border-b border-[--foreground]/10">
            <div className="mx-auto px-4 flex container h-16 items-center justify-between gap-4">
                <div className="text-xl font-semibold">RAG Chatbot</div>

                <div className="flex gap-2">
                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button variant="ghost">Sign In</Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <Button variant="outline">Sign Up</Button>
                        </SignUpButton>
                    </Show>

                    <Show when="signed-in">
                        <SignOutButton>
                            <Button variant="outline">Sign Out</Button>
                        </SignOutButton>
                    </Show>
                </div>
            </div>
        </nav>
    )
}