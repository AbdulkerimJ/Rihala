import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormField } from "./FormField";
import { Select } from "./Select";
import { Modal } from "./Modal";
import toast from "react-hot-toast";

export const CreatableSelect = ({
  // FormField props
  label,
  required,
  error,
  
  // Select props
  name,
  register,
  options,
  placeholder,
  disabled,
  
  // Creatable props
  createTitle,
  FormComponent,
  createMutationFn,
  queryKey,
  setValue, // from useForm
  ...props
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createMutationFn,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${createTitle.replace("New ", "")} created successfully`);
      setIsModalOpen(false);
      
      const newEntity = response.data?.supplier || response.data?.contractor || response.data?.customer || response.data;
      if (newEntity && newEntity._id) {
        setValue(name, newEntity._id, { shouldValidate: true });
      }
    },
  });

  const handleCreate = async (data) => {
    return createMutation.mutateAsync(data);
  };

  return (
    <>
      <FormField 
        label={label} 
        required={required} 
        error={error}
        labelRight={
          !disabled && (
            <button 
              type="button" 
              onClick={() => setIsModalOpen(true)}
              className="text-accent hover:underline font-medium"
            >
              + New
            </button>
          )
        }
      >
        <Select
          {...register(name)}
          placeholder={placeholder}
          options={options}
          error={error}
          disabled={disabled}
          {...props}
        />
        {props.children}
      </FormField>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={createTitle}
      >
        <div onSubmit={(e) => e.stopPropagation()}>
          <FormComponent 
            onSubmit={handleCreate} 
            onClose={() => setIsModalOpen(false)} 
          />
        </div>
      </Modal>
    </>
  );
};
