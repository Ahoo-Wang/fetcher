---
name: decorated-service-class
tags: [negative]
runs: 3
max_turns: 8
allowed_tools: [Read, Glob, Grep, Skill]
---

I already have a NamedFetcher called 'api'. On top of it, declare an OrderService class with a @get('/{id}') getOrder(id) method and a @post('') createOrder(order) method for /orders.
