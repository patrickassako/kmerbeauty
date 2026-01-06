import React, { useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
// PostHog temporarily disabled for AAB build compatibility
// import { usePostHog } from 'posthog-react-native';

export const TrackedNavigationContainer = ({ children, ...props }: any) => {
    const navigationRef = useNavigationContainerRef();
    const routeNameRef = useRef<string>();
    // PostHog disabled temporarily
    // const posthog = usePostHog();

    return (
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                routeNameRef.current = navigationRef.getCurrentRoute()?.name;
            }}
            onStateChange={() => {
                const previousRouteName = routeNameRef.current;
                const currentRouteName = navigationRef.getCurrentRoute()?.name;

                if (previousRouteName !== currentRouteName && currentRouteName) {
                    // PostHog tracking disabled temporarily
                    // posthog?.screen(currentRouteName);
                    console.log('Screen view:', currentRouteName);
                }
                routeNameRef.current = currentRouteName;
            }}
            {...props}
        >
            {children}
        </NavigationContainer>
    );
};
