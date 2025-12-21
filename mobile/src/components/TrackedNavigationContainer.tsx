import React, { useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';

export const TrackedNavigationContainer = ({ children, ...props }: any) => {
    const navigationRef = useNavigationContainerRef();
    const routeNameRef = useRef<string>();
    const posthog = usePostHog();

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
                    posthog?.screen(currentRouteName);
                }
                routeNameRef.current = currentRouteName;
            }}
            {...props}
        >
            {children}
        </NavigationContainer>
    );
};
