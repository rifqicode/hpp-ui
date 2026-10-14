import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../services/recipe-service';
import { recipeKeys } from './use-recipes-query';
import type { CreateProductInput } from '../types';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => recipeService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recipeService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.all });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
    },
  });
}
