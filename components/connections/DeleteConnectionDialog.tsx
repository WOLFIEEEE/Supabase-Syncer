'use client';

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';
import React from 'react';

interface DeleteConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cancelRef: React.RefObject<HTMLButtonElement>;
}

export default function DeleteConnectionDialog({ isOpen, onClose, onConfirm, cancelRef }: DeleteConnectionDialogProps) {
  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(4px)">
        <AlertDialogContent bg="bg.elevated" borderColor="border.default">
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="text.primary">
            Delete Connection
          </AlertDialogHeader>

          <AlertDialogBody color="text.secondary">
            Are you sure you want to delete this connection? This action cannot be undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
