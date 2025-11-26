import { AccountView } from '@daveyplate/better-auth-ui';
import { useParams } from 'react-router-dom';

export default function AccountPage() {
    const { pathname } = useParams();
    return (
        <div className='container mx-auto py-12 px-4'>
            <AccountView pathname={pathname} />
        </div>
    );
}
