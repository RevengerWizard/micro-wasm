#include <stdbool.h>
#include <tea.h>
#include <micro.h>

/* Browser-only ABI glue to handle micro and tea state */
static tea_State* T;
static char wasm_name[] = "micro";
//static char wasm_path[] = ".";
//static char* wasm_argv[] = {wasm_name, wasm_path, NULL};
static char* wasm_argv[] = {wasm_name, NULL};

void micro_wasm_open(void)
{
    T = micro_open(1, wasm_argv);
}

int micro_wasm_frame(void)
{
    if(!spxeStep()) return 0;
    micro_run(T);
    return 1;
}

void micro_wasm_close(void)
{
    if(T)
    {
        micro_close(T);
        T = NULL;
    }
}
