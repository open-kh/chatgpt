import gradio as gr
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline, StoppingCriteria, StoppingCriteriaList, TextIteratorStreamer
import time
import numpy as np
from torch.nn import functional as F
import os
from threading import Thread

# init
tok = AutoTokenizer.from_pretrained("togethercomputer/RedPajama-INCITE-Chat-3B-v1")
m = AutoModelForCausalLM.from_pretrained("togethercomputer/RedPajama-INCITE-Chat-3B-v1", torch_dtype=torch.float16)
m = m.to('cuda:0')

class StopOnTokens(StoppingCriteria):
    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor, **kwargs) -> bool:
        #stop_ids = [[29, 13961, 31], [29, 12042, 31], 1, 0]
        stop_ids = [29, 0]
        for stop_id in stop_ids:
            #print(f"^^input ids - {input_ids}")
            if input_ids[0][-1] == stop_id:
                return True
        return False

        
def user(message, history):
    # Append the user's message to the conversation history
    return "", history + [[message, ""]]



def chat(history, top_p, top_k, temperature): 
    # Initialize a StopOnTokens object
    stop = StopOnTokens()

    # Construct the input message string for the model by concatenating the current system message and conversation history
    messages = "".join(["".join(["\n<human>:"+item[0], "\n<bot>:"+item[1]])  #curr_system_message + 
                for item in history])

    # Tokenize the messages string
    model_inputs = tok([messages], return_tensors="pt").to("cuda")
    streamer = TextIteratorStreamer(
        tok, timeout=10., skip_prompt=False, skip_special_tokens=True)
    generate_kwargs = dict(
        model_inputs,
        streamer=streamer,
        max_new_tokens=1024,
        do_sample=True,
        top_p=top_p, #0.95,
        top_k=top_k, #1000,
        temperature=temperature, #1.0,
        num_beams=1,
        stopping_criteria=StoppingCriteriaList([stop])
    )
    t = Thread(target=m.generate, kwargs=generate_kwargs)
    t.start()

    # Initialize an empty string to store the generated text
    partial_text = ""
    for new_text in streamer:
        #print(new_text)
        if new_text != '<':
            partial_text += new_text
            history[-1][1] = partial_text.split('<bot>:')[-1]
            # Yield an empty string to clean up the message textbox and the updated conversation history
            yield history
    return partial_text


title = """<h1 align="center">🔥RedPajama-INCITE-Chat-3B-v1</h1><br><h2 align="center">🏃‍♂️💨Streaming with Transformers & Gradio💪</h2>"""
description = """<br><br><h3 align="center">This is a RedPajama Chat model fine-tuned using data from Dolly 2.0 and Open Assistant over the RedPajama-INCITE-Base-3B-v1 base model.</h3>"""
theme = gr.themes.Soft(
    primary_hue=gr.themes.Color("#ededed", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#6c1e1e"),
    neutral_hue="red",
)


with gr.Blocks(theme=theme) as demo:
    gr.HTML(title)
    gr.HTML('''<center><a href="https://huggingface.co/spaces/ysharma/RedPajama-Chat-3B?duplicate=true"><img src="https://bit.ly/3gLdBN6" alt="Duplicate Space"></a>Duplicate the Space to skip the queue and run in a private space</center>''')
    chatbot = gr.Chatbot().style(height=500)
    with gr.Row():
        with gr.Column():
            msg = gr.Textbox(label="Chat Message Box", placeholder="Chat Message Box",
                             show_label=False).style(container=False)
        with gr.Column():
            with gr.Row():
                submit = gr.Button("Submit")
                stop = gr.Button("Stop")
                clear = gr.Button("Clear")
    
    #Advanced options - top_p, temperature, top_k
    with gr.Accordion("Advanced Options:", open=False):
        top_p = gr.Slider( minimum=-0, maximum=1.0, value=0.95, step=0.05, interactive=True, label="Top-p",)
        top_k = gr.Slider(minimum=0.0, maximum=1000, value=1000, step=1, interactive=True, label="Top-k", )
        temperature = gr.Slider( minimum=-0, maximum=5.0, value=1.0, step=0.1, interactive=True, label="Temperature",)

    submit_event = msg.submit(fn=user, inputs=[msg, chatbot], outputs=[msg, chatbot], queue=False).then(
        fn=chat, inputs=[chatbot, top_p, top_k, temperature], outputs=[chatbot], queue=True)  #inputs=[system_msg, chatbot]
    submit_click_event = submit.click(fn=user, inputs=[msg, chatbot], outputs=[msg, chatbot], queue=False).then(
        fn=chat, inputs=[chatbot, top_p, top_k, temperature], outputs=[chatbot], queue=True)  #inputs=[system_msg, chatbot]
    stop.click(fn=None, inputs=None, outputs=None, cancels=[
               submit_event, submit_click_event], queue=False)
    clear.click(lambda: None, None, [chatbot], queue=False)

    gr.Examples([
        ["Hello there! How are you doing?"],
        ["Can you explain to me briefly what is Python programming language?"],
        ["Explain the plot of Cinderella in a sentence."],
        ["What are some common mistakes to avoid when writing code?"],
        ["Write a 500-word blog post on “Benefits of Artificial Intelligence"]
    ], inputs=msg, label= "Click on any example and press the 'Submit' button"
      )
    gr.HTML(description)

demo.queue(max_size=32, concurrency_count=2)
demo.launch(debug=True)