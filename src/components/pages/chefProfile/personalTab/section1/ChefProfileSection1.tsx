import { ApolloQueryResult, useMutation } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactElement } from 'react';
import {
    UpdateUserProfilePictureDocument,
    type CookRank,
    type GetCookProfileQueryQuery,
} from '../../../../../data-source/generated/graphql';
import useResponsive from '../../../../../hooks/useResponsive';
import PEButton from '../../../../standard/buttons/PEButton';
import { Icon } from '../../../../standard/icon/Icon';
import PEIcon from '../../../../standard/icon/PEIcon';
import PEIconButton from '../../../../standard/iconButton/PEIconButton';
import PEImagePicker from '../../../../standard/imagePicker/PEImagePicker';
import PEModalPopUp from '../../../../standard/modal/PEModalPopUp';
import PETextField from '../../../../standard/textFields/PETextField';
import HStack from '../../../../utility/hStack/HStack';
import Spacer from '../../../../utility/spacer/Spacer';
import VStack from '../../../../utility/vStack/VStack';

export interface ChefProfileSection1Props {
    chefProfile: {
        cookId: string;
        isLocked: boolean;
        isVisible: boolean;
        rank: CookRank;
        user: {
            firstName: string;
            lastName: string;
            profilePictureUrl?: string | null;
        };
        ratingAverage: number;
        ratingCount: number;
    };
    refetchChefData: (variables?: Partial<{ cookId: string }> | undefined) => Promise<ApolloQueryResult<GetCookProfileQueryQuery>>;
}

export default function ChefProfileSection1({ chefProfile, refetchChefData }: ChefProfileSection1Props): ReactElement {
    const { isMobile } = useResponsive();

    const [image] = useState<string | undefined>(chefProfile.user.profilePictureUrl ?? undefined);
    const [edit, setEdit] = useState(false);
    const [firstName, setFirstName] = useState(chefProfile.user.firstName);
    const [lastName, setLastName] = useState(chefProfile.user.lastName);

    const [editFirstName, setEditFirstName] = useState(chefProfile.user.firstName);
    const [editLastName, setEditLastName] = useState(chefProfile.user.lastName);
    const [editedProfilePicture, setEditedProfilePicture] = useState<File | undefined>(undefined);

    const { t: commonTranslate } = useTranslation('common');

    function handleUnSaveChefName(): void {
        setEditFirstName(chefProfile.user.firstName);
        setEditLastName(chefProfile.user.lastName);
        setEdit(!edit);
    }

    const [updateProfilePicture] = useMutation(UpdateUserProfilePictureDocument);

    function handleSaveProfileInfo(): void {
        if (editedProfilePicture || editedProfilePicture !== image) {
            void updateProfilePicture({
                variables: { userId: chefProfile.cookId, profilePicture: editedProfilePicture },
            })
                .then((result) => result.data?.users.success && void refetchChefData())
                .catch((e) => console.error(e));
        }

        setEditedProfilePicture(undefined);
        setFirstName(editFirstName);
        setLastName(editLastName);
        setEdit(!edit);
    }

    return (
        <>
            <VStack className="w-full bg-white shadow-primary box-border p-8 md:px-4 md:py-6 rounded-4" gap={16}>
                <HStack className="w-full gap-4">
                    {image && (
                        <Image
                            style={{
                                width: isMobile ? '60px' : '120px',
                                height: isMobile ? '60px' : '120px',
                                borderRadius: 4,
                                objectPosition: 'center',
                                objectFit: 'cover',
                            }}
                            src={image}
                            alt={'Profile Picture'}
                            width={isMobile ? 60 : 120}
                            height={isMobile ? 60 : 120}
                        />
                    )}

                    {!image && (
                        <div
                            className="bg-base rounded-2 flex justify-center items-center"
                            style={{
                                minHeight: isMobile ? '60px' : '120px',
                                height: isMobile ? '60px' : '120px',
                                minWidth: isMobile ? '60px' : '120px',
                            }}
                        >
                            <PEIcon edgeLength={32} icon={Icon.profileLight} />
                        </div>
                    )}

                    <VStack style={{ justifyContent: 'space-between', alignItems: 'flex-start', width: isMobile ? '100%' : 'auto' }}>
                        <HStack
                            className="gap-4"
                            style={{
                                justifyContent: 'space-between',
                                alignItems: isMobile ? 'center' : 'flex-start',
                                width: isMobile ? '100%' : 'auto',
                                height: '100%',
                            }}
                        >
                            <VStack style={{ alignItems: 'flex-start' }}>
                                <p className="text-heading-m my-0">{firstName}</p>
                                <p className="text-start text-text-m text-disabled my-0">{lastName}</p>
                            </VStack>
                            <div className="mt-2">
                                <PEIconButton icon={Icon.editPencil} onClick={(): void => setEdit(!edit)} iconSize={24} withoutShadow />
                            </div>
                        </HStack>
                        {!isMobile ? <span>{commonTranslate(chefProfile.rank)}</span> : null}
                    </VStack>

                    {!isMobile ? <Spacer /> : null}

                    {!isMobile && (
                        <VStack style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Link href="/profile" className="no-underline">
                                <PEButton
                                    className="min-w-[250px]"
                                    iconLeft={Icon.profileOrange}
                                    iconSize={16}
                                    type="secondary"
                                    onClick={(): void => undefined}
                                    title={'Customer Profile'}
                                />
                            </Link>

                            <Spacer />

                            <HStack gap={2} className="flex-row mt-4">
                                <PEIcon icon={Icon.star} edgeLength={20} />
                                <span className="text-preBlack">{(chefProfile.ratingAverage / 3).toFixed(2)}</span>
                                <span className="text-disabled">({chefProfile.ratingCount})</span>
                            </HStack>
                        </VStack>
                    )}
                </HStack>

                {isMobile && (
                    <HStack className="w-full gap-6" style={{ justifyContent: 'flex-start' }}>
                        <span>{commonTranslate(chefProfile.rank)}</span>
                        <HStack gap={2} className="flex-row">
                            <PEIcon icon={Icon.star} edgeLength={20} />
                            <span className="text-preBlack">{(chefProfile.ratingAverage / 3).toFixed(2)}</span>
                            <span className="text-disabled">({chefProfile.ratingCount})</span>
                        </HStack>
                    </HStack>
                )}
            </VStack>

            <PEModalPopUp width={isMobile ? '100%' : 750} openMenu={edit} handleOpenMenu={handleUnSaveChefName}>
                <VStack className="w-[750px] md:w-full md:h-full px-10 md:px-4 py-15 md:py-4 box-border relative">
                    <h2 className="m-0 pb-5 w-full">Change profile info</h2>
                    <VStack className="w-full gap-4" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
                        <PETextField type={'text'} value={editFirstName} onChange={(value): void => setEditFirstName(value)} />
                        <PETextField type={'text'} value={editLastName} onChange={(value): void => setEditLastName(value)} />
                        <PEImagePicker onPick={setEditedProfilePicture} defaultImage={image} />
                    </VStack>
                    <PEButton className="max-w-[250px] mt-10" onClick={handleSaveProfileInfo} title="Save" />
                </VStack>
            </PEModalPopUp>
        </>
    );
}
