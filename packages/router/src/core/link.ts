
import { Router } from './router';

// TODO: This should be a proper Swiss component
export function Link(props: { to: string; children: any }, { router }: { router: Router }) {
    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        router.push(props.to);
    };

    // Mock returning a VNode or string structure
    return {
        tag: 'a',
        attrs: {
            href: props.to,
            onClick: handleClick
        },
        children: props.children
    };
}
