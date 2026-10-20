# env variables
# WASI_SYSROOT should point to wasi-sdk
# LIBMICRO_WASM should point to the relocatable WASM file for micro

WASM_CC ?= clang --target=wasm32-wasip1 --sysroot=$(WASI_SYSROOT)
#WASM_OPT = wasm-opt
#WASM_OPT_FLAGS = -Oz
TARGET ?= micro.wasm
GLUE_SRC = micro_wasm.c
GLUE_OBJ = micro_wasm.wasm.o

WASM_CFLAGS = -O2 -D_WASI_EMULATED_SIGNAL -DMICRO_NO_AUDIO -fno-stack-protector
WASM_LDFLAGS = -Wl,--export-all,--allow-undefined,--stack-first,-z,stack-size=1048576,-lsetjmp

all: $(TARGET)

$(GLUE_OBJ): $(GLUE_SRC)
	@echo "WASM CC      $<"
	@$(WASM_CC) $(WASM_CFLAGS) -c -o $@ $<

$(TARGET): $(LIBMICRO_WASM) $(GLUE_OBJ)
	@echo "WASM LD      $@"
	@$(WASM_CC) $(WASM_LDFLAGS) -o $@ $(LIBMICRO_WASM) $(GLUE_OBJ)
#@echo "WASM OPT     $@"
#@$(WASM_OPT) $(WASM_OPT_FLAGS) $@ -o $@

clean:
	$(RM) $(GLUE_OBJ) $(TARGET) $(TARGET).opt

.PHONY: all clean
