"use client"

import { useState, Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import {
    PromptInput,
    PromptInputBody,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools
} from "@/src/components/ai-elements/prompt-input"
import { Message, MessageContent, MessageResponse } from "@/src/components/ai-elements/message";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton
} from "@/src/components/ai-elements/conversation";
import { Shimmer } from "@/src/components/ai-elements/shimmer";

export default function RAGChatbotPage() {
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } = useChat();

    const handleSubmit = (message: PromptInputMessage) => {
        if (!message.text) return;
        sendMessage({ text: message.text });
        setInput("");
    }
    return (
        <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-4xl flex-col p-6">
            <div className="flex min-h-0 flex-1 flex-col">
                <Conversation className="min-h-0 flex-1">
                    <ConversationContent>
                        {
                            messages.map((message) => (
                                <div key={message.id}>
                                    {message.parts.map((part, index) => {
                                        switch (part.type) {
                                            case "text":
                                                return (
                                                    <Fragment key={`${message.id}-${index}`}>
                                                        <Message from={message.role}>
                                                            <MessageContent>
                                                                <MessageResponse>{part.text}</MessageResponse>
                                                            </MessageContent>
                                                        </Message>
                                                    </Fragment>
                                                );
                                            default:
                                                return null;
                                        }
                                    })}
                                </div>
                            ))
                        }
                        {(status === "submitted" || status === "streaming") && (
                            <Shimmer>Loading...</Shimmer>
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                <PromptInput onSubmit={handleSubmit} className="mt-4 shrink-0">
                    <PromptInputBody>
                        <PromptInputTextarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..." 
                        />
                    </PromptInputBody>
                    <PromptInputFooter>
                        <PromptInputTools>
                            {/* Add any additional tools or buttons here */}
                        </PromptInputTools>
                        <PromptInputSubmit />
                    </PromptInputFooter>
                </PromptInput>
            </div>
        </div>
    )
}