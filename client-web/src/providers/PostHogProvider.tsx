'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init('phc_XRuNBC4aueCg7b7gA4pKt4dsZMeR2LVOzEiRYlJTblo', {
            api_host: 'https://eu.posthog.com',
            person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
            capture_pageview: true, // We want page views
            capture_pageleave: true,
        })
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
